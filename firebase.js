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

  // Elementos para a busca global
  const globalSearchInput = document.getElementById("global-search");
  const globalSearchResults = document.getElementById("global-search-results");

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

  // Sincroniza compromissos do Firebase (child_added)
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

  // Listener para alteração de compromissos (edição)
  appointmentsRef.on("child_changed", function (data) {
    const changedId = data.key;
    const updatedAppointment = data.val();
    updatedAppointment.id = data.key;

    // Atualiza o array local
    appointments = appointments.map(app => (app.id === changedId ? updatedAppointment : app));
    generateCalendar(currentMonth, currentYear);
    displayDayAppointments(selectedDate);
  });

  // Listener para remoção de compromissos
  appointmentsRef.on("child_removed", function (data) {
    const removedId = data.key;
    appointments = appointments.filter(app => app.id !== removedId);
    generateCalendar(currentMonth, currentYear);
    displayDayAppointments(selectedDate);
  });

  // Gera o calendário inicial
  generateCalendar(currentMonth, currentYear);
  // Exibe os compromissos do dia padrão (hoje)
  displayDayAppointments(selectedDate);

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

      // Número do dia
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
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    monthYearSpan.innerText = `${monthNames[month]} de ${year}`;
  }

  // Formata a data no formato YYYY-MM-DD
  function formatDate(date) {
    let d = date.getDate();
    let m = date.getMonth() + 1;
    const y = date.getFullYear();
    if (d < 10) d = "0" + d;
    if (m < 10) m = "0" + m;
    return `${y}-${m}-${d}`;
  }

  // Exibe a lista fixa de compromissos do dia selecionado
  // com filtro (busca interna) e botões de editar/excluir
  function displayDayAppointments(dateStr) {
    dailyAppointmentsList.innerHTML = "";

    // Filtra compromissos do dia
    let dayApps = appointments.filter(app => app.date === dateStr);

    if (dayApps.length === 0) {
      const li = document.createElement("li");
      li.innerText = "Nenhum compromisso para este dia.";
      dailyAppointmentsList.appendChild(li);
    } else {
      dayApps.forEach(app => {
        const li = document.createElement("li");
        li.dataset.appointmentId = app.id;

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

        if (auth.currentUser) {
          // Botão de edição
          const editBtn = document.createElement("button");
          editBtn.classList.add("edit-btn");
          editBtn.title = "Editar compromisso";
          editBtn.innerHTML = "✏️";
          editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            inlineEditAppointment(app, li);
          });

          // Botão de deleção
          const deleteBtn = document.createElement("button");
          deleteBtn.classList.add("delete-btn");
          deleteBtn.title = "Remover compromisso";
          deleteBtn.innerHTML = "🗑️";
          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            li.classList.add("fade-out"); // Animação fade-out
            setTimeout(() => {
              deleteAppointment(app.id);
            }, 500);
          });

          // Anexa os botões de edição e deleção
          li.querySelector(".appointment-item").appendChild(editBtn);
          li.querySelector(".appointment-item").appendChild(deleteBtn);
        }

        dailyAppointmentsList.appendChild(li);
      });
    }
  }

  // Edição inline de um compromisso
  function inlineEditAppointment(app, liElement) {
    liElement.innerHTML = "";
    const form = document.createElement("form");
    form.classList.add("inline-edit-form");

    // Input para título
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = app.title;
    titleInput.required = true;
    titleInput.placeholder = "Título";
    form.appendChild(titleInput);

    // Input para hora
    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.value = app.time;
    timeInput.required = true;
    form.appendChild(timeInput);

    // Textarea para descrição
    const descInput = document.createElement("textarea");
    descInput.rows = 2;
    descInput.placeholder = "Descrição";
    descInput.value = app.description || "";
    form.appendChild(descInput);

    // Select para cor
    const colorSelect = document.createElement("select");
    const colors = [
      { value: "#007BFF", label: "Azul Padrão" },
      { value: "#FF5733", label: "Laranja" },
      { value: "#FFC300", label: "Amarelo" },
      { value: "#C70039", label: "Vermelho" },
      { value: "#900C3F", label: "Roxo" },
      { value: "#28a745", label: "Verde" },
      { value: "#17a2b8", label: "Ciano" },
      { value: "#6f42c1", label: "Violeta" },
      { value: "#343a40", label: "Preto" },
      { value: "#fd7e14", label: "Laranja Escuro" }
    ];
    colors.forEach(colorObj => {
      const option = document.createElement("option");
      option.value = colorObj.value;
      option.innerText = colorObj.label;
      if (colorObj.value === app.color) {
        option.selected = true;
      }
      colorSelect.appendChild(option);
    });
    form.appendChild(colorSelect);

    // Botão Salvar
    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.innerText = "Salvar";
    form.appendChild(saveBtn);

    // Botão Cancelar
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.innerText = "Cancelar";
    cancelBtn.style.marginLeft = "10px";
    form.appendChild(cancelBtn);

    // Ao submeter, atualiza no Firebase
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const updatedData = {
        title: titleInput.value,
        time: timeInput.value,
        description: descInput.value,
        color: colorSelect.value,
        date: app.date,      // Mantém a data original
        createdAt: app.createdAt
      };
      appointmentsRef.child(app.id).update(updatedData, function (error) {
        if (error) {
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro ao atualizar compromisso: ' + error
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Compromisso atualizado!',
            showConfirmButton: false,
            timer: 1500
          });
          displayDayAppointments(selectedDate);
        }
      });
    });

    // Ao cancelar, restaura a exibição normal
    cancelBtn.addEventListener("click", () => {
      displayDayAppointments(selectedDate);
    });

    liElement.appendChild(form);
  }

  // Remove um compromisso com confirmação
  function deleteAppointment(appointmentId) {
    if (!auth.currentUser) {
      Swal.fire({
        icon: 'error',
        title: 'Acesso Negado',
        text: 'Você precisa estar logado para remover compromissos!'
      });
      return;
    }
    Swal.fire({
      title: 'Você tem certeza?',
      text: "Esta ação não pode ser desfeita!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, deletar!'
    }).then((result) => {
      if (result.isConfirmed) {
        appointmentsRef.child(appointmentId).remove()
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Deletado!',
              text: 'O compromisso foi removido.'
            });
          })
          .catch(error => {
            Swal.fire({
              icon: 'error',
              title: 'Erro',
              text: 'Erro ao remover compromisso: ' + error
            });
          });
      } else {
        // Se o usuário cancelar, remove o efeito fade-out
        const li = document.querySelector(`li[data-appointment-id="${appointmentId}"]`);
        if (li) li.classList.remove("fade-out");
      }
    });
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
      modalAppointmentForm.style.display = (modalAppointmentForm.style.display === "none")
        ? "block"
        : "none";
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
          // Limpa formulário do modal
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
        li.innerHTML = `
          <strong>${app.title}</strong><br>
          ${app.time}<br>
          ${app.description || ""}
        `;
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

  document.getElementById("prev-year").addEventListener("click", () => {
    currentYear--;
    generateCalendar(currentMonth, currentYear);
  });

  document.getElementById("next-year").addEventListener("click", () => {
    currentYear++;
    generateCalendar(currentMonth, currentYear);
  });

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
        // Se o compromisso for do dia selecionado, atualiza a lista
        const appDate = new Date(date);
        if (formatDate(appDate) === selectedDate) {
          generateCalendar(currentMonth, currentYear);
          displayDayAppointments(selectedDate);
        }
      }
    });
  });

  // Busca global: atualiza os resultados conforme o usuário digita
  globalSearchInput.addEventListener("input", () => {
    const term = globalSearchInput.value.trim().toLowerCase();

    // Se a busca estiver vazia, exibimos nenhum resultado:
    if (!term) {
      renderGlobalSearchResults([]);
      return;
    }

    // Filtra os compromissos:
    const filteredAppointments = appointments.filter(app =>
      app.title.toLowerCase().includes(term) ||
      app.date.includes(term) ||
      app.time.toLowerCase().includes(term)
    );
    renderGlobalSearchResults(filteredAppointments);
  });

  // Exibe os resultados da busca global
  function renderGlobalSearchResults(results) {
    globalSearchResults.innerHTML = "";
    if (results.length === 0) {
      globalSearchResults.innerHTML = "";
      return;
    }
    results.forEach(app => {
      // Cria o card para cada compromisso
      const card = document.createElement("div");
      card.classList.add("search-result-card");

      card.innerHTML = `
        <h3>${app.title}</h3>
        <p><strong>Data:</strong> ${app.date}</p>
        <p><strong>Hora:</strong> ${app.time}</p>
        <p>${app.description || ""}</p>
      `;

      // Cria o botão "Mostrar Compromisso"
      const btn = document.createElement("button");
      btn.classList.add("show-appointment-btn");
      btn.innerText = "Mostrar Compromisso";
      btn.addEventListener("click", () => {
        // Converte a data do compromisso para objeto Date
        const appointmentDate = new Date(app.date);
        // Atualiza o mês e o ano atuais de acordo com o compromisso
        currentMonth = appointmentDate.getMonth();
        currentYear = appointmentDate.getFullYear();
        // Gera o calendário para o mês/ano corretos
        generateCalendar(currentMonth, currentYear);
        // Seleciona o dia do compromisso e exibe os compromissos daquele dia
        selectedDate = app.date;
        displayDayAppointments(app.date);
        // Rola a visualização para o calendário
        document.getElementById("calendar").scrollIntoView({ behavior: "smooth" });
        // Destaca o dia do compromisso
        const dayCell = document.querySelector(`.day[data-date="${app.date}"]`);
        if (dayCell) {
          dayCell.classList.add("highlight-day");
          setTimeout(() => {
            dayCell.classList.remove("highlight-day");
          }, 5000);
        }
      });
      card.appendChild(btn);

      globalSearchResults.appendChild(card);
    });
  }
});
