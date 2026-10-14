-- 1. FACILITY
CREATE TABLE facility (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  county VARCHAR(100) NOT NULL,
  sub_county VARCHAR(100),
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. USER (dashboard logins)
CREATE TABLE "user" (
  id SERIAL PRIMARY KEY,
  facility_id INTEGER REFERENCES facility(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'manager',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. HEALTH_WORKER
CREATE TABLE health_worker (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  license_number VARCHAR(50) NOT NULL,
  license_expiry DATE NOT NULL,
  license_status VARCHAR(20) DEFAULT 'active',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. SHIFT
CREATE TABLE shift (
  id SERIAL PRIMARY KEY,
  facility_id INTEGER REFERENCES facility(id) ON DELETE CASCADE,
  role_needed VARCHAR(50) NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  workers_needed INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) DEFAULT 'open',
  created_by INTEGER REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. SHIFT_ASSIGNMENT
CREATE TABLE shift_assignment (
  id SERIAL PRIMARY KEY,
  shift_id INTEGER REFERENCES shift(id) ON DELETE CASCADE,
  health_worker_id INTEGER REFERENCES health_worker(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offered',
  offered_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  UNIQUE(shift_id, health_worker_id)
);

-- 6. ATTENDANCE_RECORD
CREATE TABLE attendance_record (
  id SERIAL PRIMARY KEY,
  shift_assignment_id INTEGER UNIQUE REFERENCES shift_assignment(id) ON DELETE CASCADE,
  check_in_code VARCHAR(10),
  check_in_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);