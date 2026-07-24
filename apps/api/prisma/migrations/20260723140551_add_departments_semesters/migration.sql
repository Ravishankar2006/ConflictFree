-- AlterTable
ALTER TABLE `courses` ADD COLUMN `department_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `semester_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `enrollments` ADD COLUMN `semester_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `faculty_availability` ADD COLUMN `semester_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `timetable_slots` ADD COLUMN `semester_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `department_id` INTEGER UNSIGNED NULL;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `head_id` INTEGER UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `dept_name`(`name`),
    UNIQUE INDEX `dept_code`(`code`),
    UNIQUE INDEX `uq_dept_head`(`head_id`),
    INDEX `idx_dept_head`(`head_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semesters` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `academic_year` VARCHAR(20) NOT NULL,
    `term` ENUM('FALL', 'SPRING', 'SUMMER') NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `semesters_term_academic_year_key`(`term`, `academic_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_course_dept` ON `courses`(`department_id`);

-- CreateIndex
CREATE INDEX `idx_course_sem` ON `courses`(`semester_id`);

-- CreateIndex
CREATE INDEX `idx_enroll_sem` ON `enrollments`(`semester_id`);

-- CreateIndex
CREATE INDEX `idx_avail_sem` ON `faculty_availability`(`semester_id`);

-- CreateIndex
CREATE INDEX `idx_slot_sem` ON `timetable_slots`(`semester_id`);

-- CreateIndex
CREATE INDEX `idx_user_dept` ON `users`(`department_id`);

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `dept_head_fk` FOREIGN KEY (`head_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_dept_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_dept_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_sem_fk` FOREIGN KEY (`semester_id`) REFERENCES `semesters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `timetable_slots_sem_fk` FOREIGN KEY (`semester_id`) REFERENCES `semesters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_sem_fk` FOREIGN KEY (`semester_id`) REFERENCES `semesters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faculty_availability` ADD CONSTRAINT `faculty_avail_sem_fk` FOREIGN KEY (`semester_id`) REFERENCES `semesters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
