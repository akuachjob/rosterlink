-- Test facility
INSERT INTO facility (name, county, sub_county, phone)
VALUES ('St. Mary''s Clinic', 'Nairobi', 'Kasarani', '+254700000001');

-- Test user (password is "password123" - hashed later in real usage)
INSERT INTO "user" (facility_id, full_name, email, password_hash, role)
VALUES (1, 'Jane Manager', 'jane@stmarys.co.ke', 'placeholder_hash', 'manager');

-- Test health workers
INSERT INTO health_worker (full_name, phone_number, license_number, license_expiry, license_status, is_verified)
VALUES
('Alice Wanjiku', '+254712345001', 'NCK/2019/001', '2027-03-15', 'active', TRUE),
('Brian Otieno', '+254712345002', 'NCK/2020/045', '2026-11-01', 'expiring_soon', FALSE),
('Carol Muthoni', '+254712345003', 'NCK/2015/078', '2025-12-30', 'expired', TRUE),
('David Kiprop', '+254712345004', 'NCK/2021/112', '2028-06-20', 'active', TRUE);

-- Test shifts
INSERT INTO shift (facility_id, role_needed, shift_date, start_time, end_time, workers_needed, status, created_by)
VALUES
(1, 'nurse', '2026-10-20', '08:00', '16:00', 2, 'open', 1),
(1, 'nurse', '2026-10-21', '08:00', '16:00', 1, 'open', 1);

-- Test shift assignments
INSERT INTO shift_assignment (shift_id, health_worker_id, status)
VALUES
(1, 1, 'accepted'),
(1, 4, 'offered'),
(2, 1, 'offered');

-- Test attendance record
INSERT INTO attendance_record (shift_assignment_id, check_in_code, status)
VALUES (1, '4729', 'pending');