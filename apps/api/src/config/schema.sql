-- Smart Timetable System — Database Schema
-- Run this script to create all tables from scratch.
-- Usage: mysql -u root -p smart_timetable < schema.sql

CREATE DATABASE IF NOT EXISTS smart_timetable
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_timetable;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('admin', 'faculty', 'student') NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Courses ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Timetable Slots ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable_slots (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id  INT UNSIGNED NOT NULL,
  faculty_id INT UNSIGNED NOT NULL,
  room       VARCHAR(50)  NOT NULL,
  day        ENUM('MON','TUE','WED','THU','FRI','SAT') NOT NULL,
  start_time TIME         NOT NULL,
  end_time   TIME         NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id)   ON DELETE CASCADE,

  -- Prevent identical duplicate slots
  UNIQUE KEY uq_slot (course_id, faculty_id, day, start_time)
);

-- ─── Enrollments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  course_id  INT UNSIGNED NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE,

  UNIQUE KEY uq_enrollment (student_id, course_id)
);

-- ─── Rooms ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL UNIQUE,
  capacity   INT UNSIGNED NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Course-Faculty Assignment ───────────────────────────────────
CREATE TABLE IF NOT EXISTS course_faculty (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id  INT UNSIGNED NOT NULL,
  faculty_id INT UNSIGNED NOT NULL,

  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id)    ON DELETE CASCADE,
  UNIQUE KEY uq_course_faculty (course_id, faculty_id)
);

-- ─── Faculty Availability ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty_availability (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  faculty_id   INT UNSIGNED NOT NULL,
  day         ENUM('MON','TUE','WED','THU','FRI','SAT') NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,

  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_faculty_day (faculty_id, day)
);
