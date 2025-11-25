        let subjects = [];
        let tempSessions = [];
        const subjectForm = document.getElementById('subjectForm');
        const subjectList = document.getElementById('subjectList');
        const generateBtn = document.getElementById('generateBtn');

        const today = new Date();
        document.getElementById('semesterStart').valueAsDate = new Date(today.getFullYear(), 8, 15);
        document.getElementById('semesterEnd').valueAsDate = new Date(today.getFullYear(), 11, 20);

        document.getElementById('addSessionBtn').addEventListener('click', () => {
            const day = document.querySelector('input[name="sessionDay"]:checked');
            const start = document.getElementById('sessionStart').value;
            const end = document.getElementById('sessionEnd').value;
            if (!day || !start || !end) { alert('Pick a day and start/end time.'); return; }
            tempSessions.push({ id: Date.now() + Math.random(), day: day.value, startTime: start, endTime: end });
            renderTempSessions();
        });

        document.getElementById('addGroupBtn').addEventListener('click', () => {
            const start = document.getElementById('groupStart').value;
            const end = document.getElementById('groupEnd').value;
            const days = Array.from(document.querySelectorAll('input[name="groupDays"]:checked')).map(c => c.value);
            if (days.length === 0 || !start || !end) { alert('Pick days and start/end time.'); return; }
            days.forEach(day => {
                tempSessions.push({ id: Date.now() + Math.random(), day, startTime: start, endTime: end });
            });
            renderTempSessions();
        });

        function renderTempSessions() {
            const list = document.getElementById('sessionList');
            list.innerHTML = '';
            tempSessions.forEach(s => {
                const li = document.createElement('li');
                li.innerHTML = `${s.day} | ${formatTime(s.startTime)} - ${formatTime(s.endTime)} <button type="button" onclick="removeTempSession(${s.id})">x</button>`;
                list.appendChild(li);
            });
        }

        function removeTempSession(id) {
            tempSessions = tempSessions.filter(s => s.id !== id);
            renderTempSessions();
        }

        subjectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (tempSessions.length === 0) { alert('Please add at least one session.'); return; }
            const name = document.getElementById('subjectName').value;
            const location = document.getElementById('location').value;
            const subject = { id: Date.now(), name, location, sessions: [...tempSessions] };
            subjects.push(subject);
            tempSessions = [];
            renderTempSessions();
            renderSubjectList();
            subjectForm.reset();
        });

        function renderSubjectList() {
            if (subjects.length === 0) { subjectList.innerHTML = '<div class="empty-state">No subjects added yet. Use the form to add your first class!</div>'; return; }
            subjectList.innerHTML = '';
            subjects.forEach(subject => {
                const subjectEl = document.createElement('div');
                subjectEl.className = 'subject-item';
                const sessionsText = subject.sessions.map(s => `${s.day} | ${formatTime(s.startTime)} - ${formatTime(s.endTime)}`).join('<br>');
                subjectEl.innerHTML = `
                    <div class="subject-header">
                        <span class="subject-name">${subject.name}</span>
                        <div class="subject-actions">
                            <button class="btn-small btn-remove" onclick="removeSubject(${subject.id})">Remove</button>
                        </div>
                    </div>
                    <div class="subject-times">${sessionsText} ${subject.location ? `| ${subject.location}` : ''}</div>
                `;
                subjectList.appendChild(subjectEl);
            });
        }

        function removeSubject(id) { subjects = subjects.filter(subject => subject.id !== id); renderSubjectList(); }

        function formatTime(timeStr) {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const formattedHours = h % 12 || 12;
            return `${formattedHours}:${minutes} ${ampm}`;
        }

        generateBtn.addEventListener('click', function() {
            const startDate = document.getElementById('semesterStart').value;
            const endDate = document.getElementById('semesterEnd').value;
            const timezone = document.getElementById('timezone').value;
            if (!startDate || !endDate) { alert('Please select both start and end dates.'); return; }
            if (subjects.length === 0) { alert('Please add at least one subject.'); return; }
            const icsContent = generateICSContent(startDate, endDate, timezone);
            downloadFile(icsContent, 'my_schedule.ics', 'text/calendar');
        });

 function generateICSContent(startDate, endDate, timezone) {
            let icsContent = [ 'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Custom Schedule Builder//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH' ];
            subjects.forEach(subject => {
                subject.sessions.forEach(session => {
                    const startDateTime = session.startTime.replace(':', '') + '00';
                    const endDateTime = session.endTime.replace(':', '') + '00';
                    icsContent.push('BEGIN:VEVENT');
                    icsContent.push(`SUMMARY:${subject.name}`);
                    icsContent.push(`LOCATION:${subject.location || 'TBA'}`);
                    icsContent.push(`DTSTART;TZID=${timezone}:${startDate.replace(/-/g, '')}T${startDateTime}`);
                    icsContent.push(`DTEND;TZID=${timezone}:${startDate.replace(/-/g, '')}T${endDateTime}`);
                    icsContent.push(`RRULE:FREQ=WEEKLY;UNTIL=${endDate.replace(/-/g, '')}T235959;BYDAY=${session.day}`);
                    icsContent.push('END:VEVENT');
                });
            });
            icsContent.push('END:VCALENDAR');
            return icsContent.join('\n');
        }

        function downloadFile(content, fileName, contentType) {
            const blob = new Blob([content], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        renderSubjectList();