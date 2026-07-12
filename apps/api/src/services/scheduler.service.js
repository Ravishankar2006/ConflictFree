const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function doTimesOverlap(s1, s2) {
  return s1.start < s2.end && s1.end > s2.start;
}

function getFacultyAvailabilityMap(availability) {
  const map = {};
  for (const a of availability) {
    if (!map[a.faculty_id]) map[a.faculty_id] = {};
    map[a.faculty_id][a.day] = {
      start: timeToMinutes(a.start_time),
      end: timeToMinutes(a.end_time)
    };
  }
  return map;
}

function getEnrollmentsByCourse(enrollments) {
  const map = {};
  for (const e of enrollments) {
    if (!map[e.course_id]) map[e.course_id] = [];
    map[e.course_id].push(e.student_id);
  }
  return map;
}

function generateTimeSlots(startMin, endMin, duration) {
  const slots = [];
  for (let min = startMin; min + duration <= endMin; min += 30) {
    slots.push({ start: min, end: min + duration });
  }
  return slots;
}

function buildCourseOfferings(courses, enrollmentsByCourse, rooms, courseFaculty) {
  const facultyByCourse = {};
  for (const cf of courseFaculty) {
    if (!facultyByCourse[cf.course_id]) facultyByCourse[cf.course_id] = [];
    facultyByCourse[cf.course_id].push(cf.faculty_id);
  }

  return courses.map(course => {
    const enrolledStudents = enrollmentsByCourse[course.id] || [];
    const neededCapacity = enrolledStudents.length;

    const suitableRooms = rooms.filter(r => r.capacity >= neededCapacity);
    const assignedFacultyIds = facultyByCourse[course.id] || [];

    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      enrolledStudents,
      studentCount: enrolledStudents.length,
      suitableRoomIds: suitableRooms.map(r => r.id),
      assignedFacultyIds,
      difficultyScore: suitableRooms.length === 0 ? 999 : 1 / suitableRooms.length
    };
  }).filter(o => o.suitableRoomIds.length > 0)
    .sort((a, b) => b.difficultyScore - a.difficultyScore);
}

function checkRoomConflict(slot, assigned, excludeIndex) {
  for (let i = 0; i < assigned.length; i++) {
    if (i === excludeIndex) continue;
    const other = assigned[i];
    if (slot.day !== other.day) continue;
    if (slot.roomId !== other.roomId) continue;
    if (doTimesOverlap(slot, other)) return other;
  }
  return null;
}

function checkFacultyConflict(slot, assigned, excludeIndex) {
  for (let i = 0; i < assigned.length; i++) {
    if (i === excludeIndex) continue;
    const other = assigned[i];
    if (slot.day !== other.day) continue;
    if (slot.facultyId !== other.facultyId) continue;
    if (doTimesOverlap(slot, other)) return other;
  }
  return null;
}

function checkStudentConflict(slot, assigned, excludeIndex) {
  if (!slot.enrolledStudents || slot.enrolledStudents.length === 0) return null;

  const studentSet = new Set(slot.enrolledStudents);

  for (let i = 0; i < assigned.length; i++) {
    if (i === excludeIndex) continue;
    const other = assigned[i];
    if (slot.day !== other.day) continue;
    if (!doTimesOverlap(slot, other)) continue;
    if (other.enrolledStudents && other.enrolledStudents.some(s => studentSet.has(s))) {
      return other;
    }
  }
  return null;
}

function checkFacultyAvailability(facultyAvailMap, facultyId, day, startMin, endMin) {
  const avail = facultyAvailMap[facultyId]?.[day];
  if (!avail) return false;
  return startMin >= avail.start && endMin <= avail.end;
}

function getDayLoad(assigned, days) {
  const load = {};
  for (const d of days) load[d] = 0;
  for (const s of assigned) load[s.day] = (load[s.day] || 0) + 1;
  return load;
}

function getFacultyLoad(assigned) {
  const load = {};
  for (const s of assigned) {
    load[s.faculty_id] = (load[s.faculty_id] || 0) + 1;
  }
  return load;
}

function getRoomDayLoad(assigned) {
  const load = {};
  for (const s of assigned) {
    const key = `${s.roomId}-${s.day}`;
    load[key] = (load[key] || 0) + 1;
  }
  return load;
}

function scoreCandidate(candidate, assigned, dayLoad, facultyLoad, roomDayLoad, randomize) {
  let score = 0;

  const dl = dayLoad[candidate.day] || 0;
  score += dl * 10;

  const fl = facultyLoad[candidate.faculty_id] || 0;
  score += fl * 15;

  const rdl = roomDayLoad[`${candidate.roomId}-${candidate.day}`] || 0;
  score += rdl * 5;

  const startHour = candidate.start / 60;
  if (startHour >= 8 && startHour < 10) score -= 5;
  else if (startHour >= 12 && startHour < 14) score += 3;

  if (randomize) {
    score += (Math.random() - 0.5) * 40;
  }

  return score;
}

function tryPlaceSlot(offering, days, timeSlots, faculty, rooms, assigned, facultyAvailMap, maxAttempts, attemptsRef, randomize) {
  const candidates = [];

  for (const day of days) {
    for (const ts of timeSlots) {
      const startStr = minutesToTime(ts.start);
      const endStr = minutesToTime(ts.end);

      for (const facultyMember of faculty) {
        if (attemptsRef.current >= maxAttempts) break;

        if (!checkFacultyAvailability(facultyAvailMap, facultyMember.id, day, ts.start, ts.end)) {
          attemptsRef.current++;
          continue;
        }

        for (const roomId of offering.suitableRoomIds) {
          attemptsRef.current++;

          const candidate = {
            course_id: offering.courseId,
            course_code: offering.courseCode,
            course_name: offering.courseName,
            faculty_id: facultyMember.id,
            faculty_name: facultyMember.name,
            room: rooms.find(r => r.id === roomId)?.name || '',
            roomId,
            day,
            start_time: startStr,
            end_time: endStr,
            start: ts.start,
            end: ts.end,
            enrolledStudents: offering.enrolledStudents
          };

          if (checkRoomConflict(candidate, assigned)) continue;
          if (checkFacultyConflict(candidate, assigned)) continue;
          if (checkStudentConflict(candidate, assigned)) continue;

          const dayLoad = getDayLoad(assigned, days);
          const facultyLoad = getFacultyLoad(assigned);
          const roomDayLoad = getRoomDayLoad(assigned);
          const score = scoreCandidate(candidate, assigned, dayLoad, facultyLoad, roomDayLoad, randomize);

          candidates.push({ candidate, score });
        }
        if (attemptsRef.current >= maxAttempts) break;
      }
      if (attemptsRef.current >= maxAttempts) break;
    }
    if (attemptsRef.current >= maxAttempts) break;
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.score - b.score);
    const best = candidates[0].candidate;
    assigned.push({
      course_id: best.course_id,
      course_code: best.course_code,
      course_name: best.course_name,
      faculty_id: best.faculty_id,
      faculty_name: best.faculty_name,
      room: best.room,
      roomId: best.roomId,
      day: best.day,
      start_time: best.start_time,
      end_time: best.end_time,
      start: best.start,
      end: best.end,
      enrolledStudents: best.enrolledStudents
    });
    return true;
  }
  return false;
}

export function generateTimetable({ courses, faculty, rooms, enrollments, availability, courseFaculty, params }) {
  const enrollmentsByCourse = getEnrollmentsByCourse(enrollments);
  const facultyAvailMap = getFacultyAvailabilityMap(availability);
  const courseFacultyList = courseFaculty || [];

  const startTime = params?.startTime || '08:00';
  const endTime = params?.endTime || '17:00';
  const slotDuration = params?.slotDuration || 90;
  const excludedDays = params?.excludedDays || [];
  const slotsPerCourse = params?.slotsPerCourse || 1;
  const randomize = params?.randomize !== false;

  const gridStart = timeToMinutes(startTime);
  const gridEnd = timeToMinutes(endTime);
  const days = ALL_DAYS.filter(d => !excludedDays.includes(d));

  const timeSlots = generateTimeSlots(gridStart, gridEnd, slotDuration);
  const offerings = buildCourseOfferings(courses, enrollmentsByCourse, rooms, courseFacultyList);

  const assigned = [];
  const unplacedRequests = [];
  let totalUnplaced = 0;
  const maxAttempts = 100000;
  const attemptsRef = { current: 0 };

  for (const offering of offerings) {
    let placedCount = 0;
    const eligibleFaculty = offering.assignedFacultyIds.length > 0
      ? faculty.filter(f => offering.assignedFacultyIds.includes(f.id))
      : faculty;
    if (eligibleFaculty.length === 0) continue;

    for (let i = 0; i < slotsPerCourse; i++) {
      if (attemptsRef.current >= maxAttempts) break;

      const shuffledFaculty = randomize ? [...eligibleFaculty].sort(() => Math.random() - 0.5) : eligibleFaculty;
      const placed = tryPlaceSlot(
        offering, days, timeSlots, shuffledFaculty, rooms, assigned,
        facultyAvailMap, maxAttempts, attemptsRef, randomize
      );

      if (placed) {
        placedCount++;
      } else {
        break;
      }
    }

    if (placedCount < slotsPerCourse) {
      const missed = slotsPerCourse - placedCount;
      totalUnplaced += missed;
      unplacedRequests.push({
        courseId: offering.courseId,
        courseCode: offering.courseCode,
        courseName: offering.courseName,
        reason: `Placed ${placedCount}/${slotsPerCourse} — ${missed} slot(s) could not be scheduled`
      });
    }
  }

  return {
    slots: assigned.map(s => ({
      course_id: s.course_id,
      course_code: s.course_code,
      course_name: s.course_name,
      faculty_id: s.faculty_id,
      faculty_name: s.faculty_name,
      room: s.room,
      day: s.day,
      start_time: s.start_time,
      end_time: s.end_time
    })),
    unassigned: unplacedRequests.map(u => ({
      course_id: u.courseId,
      course_code: u.courseCode,
      course_name: u.courseName,
      reason: u.reason
    })),
    config: {
      startTime,
      endTime,
      slotDuration,
      excludedDays,
      slotsPerCourse,
      randomize
    },
    stats: {
      total_courses: offerings.length,
      total_slots_requested: offerings.length * slotsPerCourse,
      placed: assigned.length,
      unplaced: totalUnplaced,
      attempts: attemptsRef.current
    }
  };
}
