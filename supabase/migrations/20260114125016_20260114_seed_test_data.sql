/*
  # Seed test data for photos and timeline

  1. Add test photos to demonstrate gallery
  2. Add test timeline events
*/

INSERT INTO photos (url, title, description, category, date) VALUES
('https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=600', 'Moteur d''origine', 'Moteur d''origine avant restauration', 'engine', '2024-01-15'),
('https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=600', 'Carrosserie - Avant', 'État initial de la carrosserie', 'bodywork', '2024-01-20'),
('https://images.pexels.com/photos/3945682/pexels-photo-3945682.jpeg?auto=compress&cs=tinysrgb&w=600', 'Système électrique', 'Installation électrique restaurée', 'electrical', '2024-02-10');

INSERT INTO timeline_events (date, title, description, status, category) VALUES
('2024-01-10', 'Début du projet', 'Acquisition du véhicule et inspection initiale', 'completed', 'planning'),
('2024-02-01', 'Restauration du moteur', 'Démontage et restauration complète du moteur', 'completed', 'engine'),
('2024-03-15', 'Travaux électriques', 'Remplacement du système électrique', 'in-progress', 'electrical');
