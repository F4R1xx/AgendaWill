document.addEventListener("DOMContentLoaded", function () {
    // ====================== CONFIGURAR FIREBASE AQUI ======================
    const firebaseConfig = {
        apiKey: "AIzaSyD1wDTxzjweuWdJEiM_CsFtrcIWLsR6uzI",
        authDomain: "agenda-f3586.firebaseapp.com",
        projectId: "agenda-f3586",
        storageBucket: "agenda-f3586.firebasestorage.app",
        messagingSenderId: "387929971337",
        appId: "1:387929971337:web:d0f27500d3a1b4553e0458"
    };
    // ======================================================================

    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const appointmentsRef = database.ref("appointments");
    const auth = firebase.auth();

    // Estado do calendário e dos compromissos
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let appointments = [];

    // Para exibição dos compromissos do dia selecionado
    let selectedDate = formatDate(new Date());

    // Elementos de Login/Registro e Usuário
    const loginContainer = document.getElementById("login-container");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const loginBtn = document.getElementById("login-btn");
    const userInfo = document.getElementById("user-info");
    const userEmailDisplay = document.getElementById("user-email");
    const logoutBtn = document.getElementById("logout-btn");
    const appointmentSection = document.getElementById("appointment-section");
    const modalAddBtn = document.getElementById("modal-add-btn");

    // Elemento para a lista fixa de compromissos do dia
    const dailyAppointmentsList = document.getElementById("daily-appointments-list");

    // Monitorar mudanças no estado de autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário logado: oculta área de login e exibe opções de modificação
            loginContainer.style.display = "none";
            userInfo.style.display = "flex";
            userEmailDisplay.textContent = user.email;
            appointmentSection.style.display = "block";
            modalAddBtn.style.display = "block";
        } else {
            // Usuário não logado: exibe somente o calendário e compromissos
            loginContainer.style.display = "block";
            userInfo.style.display = "none";
            appointmentSection.style.display = "none";
            modalAddBtn.style.display = "none";
        }
    });

    // Evento de Login (registro removido)
    loginBtn.addEventListener("click", function () {
        const email = loginEmail.value;
        const password = loginPassword.value;
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Login realizado!',
                    showConfirmButton: false,
                    timer: 1500
                });
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no login',
                    text: error.message
                });
            });
    });

    // Evento de Logout
    logoutBtn.addEventListener("click", function () {
        auth.signOut().then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Deslogado com sucesso!',
                showConfirmButton: false,
                timer: 1500
            });
        });
    });

    // Sincroniza compromissos do Firebase (leitura para todos)
    appointmentsRef.on("child_added", function (data) {
        const appointment = data.val();
        appointment.id = data.key;
        appointments.push(appointment);
        // Se o compromisso for do mês atual, atualiza o calendário
        const appDate = new Date(appointment.date);
        if (appDate.getFullYear() === currentYear && appDate.getMonth() === currentMonth) {
            generateCalendar(currentMonth, currentYear);
        }
        // Se o compromisso for do dia selecionado, atualiza a lista fixa
        if (appointment.date === selectedDate) {
            displayDayAppointments(selectedDate);
        }
    });

    // Função para gerar o calendário completo
    function generateCalendar(month, year) {
        const calendar = document.getElementById("calendar");
        calendar.innerHTML = "";
        const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        daysOfWeek.forEach(day => {
            const header = document.createElement("div");
            header.classList.add("day-header");
            header.innerText = day;
            calendar.appendChild(header);
        });

        const firstDayOfGrid = new Date(year, month, 1);
        const firstDayWeekday = firstDayOfGrid.getDay();
        firstDayOfGrid.setDate(firstDayOfGrid.getDate() - firstDayWeekday);

        // Data real (hoje) para comparação – sem horas
        const realToday = new Date();
        realToday.setHours(0, 0, 0, 0);

        for (let i = 0; i < 42; i++) {
            const dayCell = document.createElement("div");
            dayCell.classList.add("day");

            const dayDate = new Date(firstDayOfGrid);
            dayDate.setDate(firstDayOfGrid.getDate() + i);
            const dayStr = formatDate(dayDate);
            dayCell.dataset.date = dayStr;

            if (dayDate.getMonth() === month && dayDate.getFullYear() === year) {
                dayCell.classList.add("active-month-day");
            } else {
                dayCell.classList.add("other-month-day");
            }

            // Define classes para o dia de hoje e dias passados
            const cellDate = new Date(dayDate);
            cellDate.setHours(0, 0, 0, 0);
            if (cellDate.getTime() === realToday.getTime()) {
                dayCell.classList.add("today");
                // Define o dia selecionado (default: hoje)
                selectedDate = dayStr;
                displayDayAppointments(selectedDate);
            } else if (cellDate.getTime() < realToday.getTime()) {
                dayCell.classList.add("past");
            }

            const dayNumber = document.createElement("div");
            dayNumber.classList.add("day-number");
            dayNumber.innerText = dayDate.getDate();
            dayCell.appendChild(dayNumber);

            // Exibe pontinhos para cada compromisso no dia
            const dayAppointments = appointments.filter(app => app.date === dayStr);
            dayAppointments.forEach(app => {
                const dot = document.createElement("span");
                dot.classList.add("appointment-dot");
                dot.style.backgroundColor = app.color || "#007BFF";
                dayCell.appendChild(dot);
            });

            // Ao clicar, abre o modal e atualiza a lista fixa de compromissos
            dayCell.addEventListener("click", () => {
                selectedDate = dayStr;
                displayDayAppointments(selectedDate);
                openModal(dayStr);
            });
            calendar.appendChild(dayCell);
        }
        const monthYearSpan = document.getElementById("month-year");
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        monthYearSpan.innerText = `${monthNames[month]} de ${year}`;
    }

    // Função para formatar a data no formato YYYY-MM-DD
    function formatDate(date) {
        let d = date.getDate();
        let m = date.getMonth() + 1;
        const y = date.getFullYear();
        d = d < 10 ? "0" + d : d;
        m = m < 10 ? "0" + m : m;
        return `${y}-${m}-${d}`;
    }

    // Função para exibir a lista fixa de compromissos do dia selecionado
    function displayDayAppointments(dateStr) {
        dailyAppointmentsList.innerHTML = "";
        const dayApps = appointments.filter(app => app.date === dateStr);
        if (dayApps.length === 0) {
            const li = document.createElement("li");
            li.innerText = "Nenhum compromisso para este dia.";
            dailyAppointmentsList.appendChild(li);
        } else {
            dayApps.forEach(app => {
                const li = document.createElement("li");
                li.innerHTML = `
          <div class="appointment-item">
            <span class="color-marker" style="background-color: ${app.color};"></span>
            <div class="appointment-details">
              <strong>${app.title}</strong><br>
              <span class="time">${app.time}</span><br>
              <span class="description">${app.description || '-'}</span>
            </div>
          </div>
        `;
                dailyAppointmentsList.appendChild(li);
            });
        }
    }

    // Abre o modal com os compromissos do dia
    function openModal(dateStr) {
        const modal = document.getElementById("modal");
        const modalDateSpan = document.getElementById("modal-date");
        modalDateSpan.innerText = dateStr;
        loadModalAppointments(dateStr);
        modal.style.display = "block";

        const modalAddBtn = document.getElementById("modal-add-btn");
        const modalAppointmentForm = document.getElementById("modal-appointment-form");
        const modalSaveBtn = document.getElementById("modal-save-btn");

        if (!auth.currentUser) {
            modalAddBtn.style.display = "none";
            modalAppointmentForm.style.display = "none";
        } else {
            modalAddBtn.style.display = "block";
        }

        modalAddBtn.onclick = () => {
            modalAppointmentForm.style.display = (modalAppointmentForm.style.display === "none") ? "block" : "none";
        };

        modalSaveBtn.onclick = () => {
            const title = document.getElementById("modal-title").value;
            const time = document.getElementById("modal-time").value;
            const description = document.getElementById("modal-description").value;
            const color = document.getElementById("modal-color").value;
            if (!title || !time) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Preencha Título e Hora!'
                });
                return;
            }
            const newAppointment = {
                title,
                date: dateStr,
                time,
                description,
                color,
                createdAt: new Date().toISOString()
            };
            appointmentsRef.push(newAppointment, function (error) {
                if (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        text: 'Erro ao adicionar compromisso: ' + error
                    });
                } else {
                    document.getElementById("modal-title").value = "";
                    document.getElementById("modal-time").value = "";
                    document.getElementById("modal-description").value = "";
                    document.getElementById("modal-color").value = "#007BFF";
                    modalAppointmentForm.style.display = "none";
                    loadModalAppointments(dateStr);
                    generateCalendar(currentMonth, currentYear);
                    displayDayAppointments(dateStr);
                    Swal.fire({
                        icon: 'success',
                        title: 'Compromisso criado!',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }
            });
        };
    }

    // Carrega os compromissos no modal (lista interna)
    function loadModalAppointments(dateStr) {
        const modalAppointmentsList = document.getElementById("modal-appointments");
        modalAppointmentsList.innerHTML = "";
        const dayApps = appointments.filter(app => app.date === dateStr);
        if (dayApps.length === 0) {
            const li = document.createElement("li");
            li.innerText = "Nenhum compromisso para este dia.";
            modalAppointmentsList.appendChild(li);
        } else {
            dayApps.forEach(app => {
                const li = document.createElement("li");
                li.style.borderLeft = `4px solid ${app.color || "#007BFF"}`;
                li.innerHTML = `<strong>${app.title}</strong><br>
                          ${app.time}<br>
                          ${app.description || ""}`;
                modalAppointmentsList.appendChild(li);
            });
        }
    }

    // Fechar o modal ao clicar no "X" ou fora do conteúdo
    document.getElementById("close-modal").addEventListener("click", () => {
        document.getElementById("modal").style.display = "none";
    });
    window.addEventListener("click", (e) => {
        if (e.target === document.getElementById("modal")) {
            document.getElementById("modal").style.display = "none";
        }
    });

    // Navegação do Calendário
    // Mês
    document.getElementById("prev-month").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });
    document.getElementById("next-month").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });
    // Ano
    document.getElementById("prev-year").addEventListener("click", () => {
        currentYear--;
        generateCalendar(currentMonth, currentYear);
    });
    document.getElementById("next-year").addEventListener("click", () => {
        currentYear++;
        generateCalendar(currentMonth, currentYear);
    });
    // Botão "Hoje"
    document.getElementById("today-btn").addEventListener("click", () => {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        selectedDate = formatDate(today);
        generateCalendar(currentMonth, currentYear);
        displayDayAppointments(selectedDate);
    });

    // Formulário principal para adicionar compromisso (somente para usuários logados)
    const form = document.getElementById("appointment-form");
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!auth.currentUser) {
            Swal.fire({
                icon: 'error',
                title: 'Acesso Negado',
                text: 'Você precisa estar logado para adicionar compromissos!'
            });
            return;
        }
        const title = document.getElementById("title").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;
        const description = document.getElementById("description").value;
        const color = document.getElementById("color").value;
        if (!title || !date || !time) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Preencha Título, Data e Hora!'
            });
            return;
        }
        const newAppointment = {
            title,
            date,
            time,
            description,
            color,
            createdAt: new Date().toISOString()
        };
        appointmentsRef.push(newAppointment, function (error) {
            if (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Erro ao adicionar compromisso: ' + error
                });
            } else {
                form.reset();
                Swal.fire({
                    icon: 'success',
                    title: 'Compromisso criado!',
                    showConfirmButton: false,
                    timer: 1500
                });
                // Atualiza o calendário e a lista fixa se o compromisso for do dia atual selecionado
                const appDate = new Date(date);
                if (formatDate(appDate) === selectedDate) {
                    generateCalendar(currentMonth, currentYear);
                    displayDayAppointments(selectedDate);
                }
            }
        });
    });

    // Gera o calendário inicial e exibe os compromissos do dia padrão (hoje)
    generateCalendar(currentMonth, currentYear);
    displayDayAppointments(selectedDate);
});
