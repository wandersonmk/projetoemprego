-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info'
) RETURNS notifications AS $$
DECLARE
  v_notification notifications;
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type)
  RETURNING * INTO v_notification;
  
  RETURN v_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification triggers
CREATE OR REPLACE FUNCTION notify_service_application() RETURNS TRIGGER AS $$
BEGIN
  -- Notify client about new application
  PERFORM create_notification(
    (SELECT client_id FROM services WHERE id = NEW.service_id),
    'Nova Candidatura',
    'Um profissional se candidatou ao seu serviço',
    'info'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_service_application_insert
  AFTER INSERT ON service_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_service_application();

-- Trigger for application status change
CREATE OR REPLACE FUNCTION notify_application_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    -- Notify provider about status change
    PERFORM create_notification(
      NEW.provider_id,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Candidatura Aceita'
        WHEN NEW.status = 'rejected' THEN 'Candidatura Recusada'
        ELSE 'Status da Candidatura Atualizado'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Sua candidatura foi aceita! Entre em contato com o cliente.'
        WHEN NEW.status = 'rejected' THEN 'Sua candidatura não foi aceita desta vez.'
        ELSE 'O status da sua candidatura foi atualizado.'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON service_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();