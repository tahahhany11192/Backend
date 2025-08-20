 async function fetchCourses() {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) {
                    console.warn("No authentication token found");
                    courseSelect.innerHTML = '<option value="">Please login first</option>';
                    return;
                }

                const res = await fetch('http://localhost:5000/api/users/my-coursess', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (res.status === 401) {
                    localStorage.removeItem('userToken');
                    alert('Session expired. Please login again.');
                    window.location.href = '/Orycomedu/OrycomLogin.html';
                    return;
                }

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();
                courseSelect.innerHTML = data.data?.length 
                    ? data.data.map(course => `<option value="${course._id}">${course.title}</option>`).join('')
                    : '<option value="">No courses available</option>';
            } catch (err) {
                console.error("Error fetching courses:", err);
                courseSelect.innerHTML = `
                    <option value="">Error loading courses</option>
                    ${roomIdInput.value ? `<option value="${roomIdInput.value}">Manual: ${roomIdInput.value}</option>` : ''}
                `;
            }
        }