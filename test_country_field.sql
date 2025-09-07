-- Test script to verify country field implementation
-- This should be run once the database is available

INSERT INTO `users` (id, email, passwordHash, name, city, country, age, createdAt, updatedAt) VALUES 
('test-id', 'test@example.com', 'hashed_password', 'Test User', 'Jakarta', 'ID', 25, NOW(), NOW());

SELECT * FROM `users` WHERE email = 'test@example.com';
