/* =================================================================
   MÓDULO: CALENDÁRIO (Lógica Pura - CSS Externo)
   ================================================================= */

const calendarGrid = document.getElementById('calendario-grid');
const currentMonthElement = document.getElementById('mes-ano-calendario');
const eventosContainer = document.getElementById('lista-eventos-dia');

let currentDate = new Date();
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];

// DADOS DO PDF CALENDÁRIO ÁGAPE 2026
const agapeEvents = {
    '0-17': 'Retorno do Ágape',
    '0-24': 'Workshop 1',
    '1-1': 'Workshop 2',
    '1-3': 'Intercessão / Pré-encontro',
    '1-7': 'Workshop 3',
    '1-10': 'Intercessão',
    '1-14': 'Carnaval',
    '1-21': 'Noite de Tortas',
    '1-22': 'Mutirão de Mensagens',
    '1-24': 'Intercessão / Pré-encontro',
    '2-1': 'Passagem do Encontro',
    '2-3': 'Missa de Envio',
    '2-7': 'Encontro',
    '2-8': 'Encontro',
    '2-14': 'Filho Pródigo',
    '2-21': '1ª Vivência de Cursistas',
    '2-22': '1ª Formação de Servos',
    '2-29': 'Relação com Deus (Caça ao Tesouro)',
    '3-5': 'Páscoa',
    '3-11': 'Ágape: Viver a Caridade',
    '3-18': 'Deus Pai',
    '3-25': '2ª Vivência de Cursistas',
    '3-26': '2ª Formação de Servos',
    '3-28': 'Intercessão',
    '4-2': 'Deus Filho',
    '4-10': 'Dia das Mães',
    '4-16': 'Deus Espírito Santo / Conf.',
    '4-23': '3ª Vivência / Pentecostes',
    '4-24': '3ª Formação de Servos',
    '4-26': 'Intercessão',
    '4-29': 'Festa Junina',
    '4-30': 'Festa Junina',
    '4-31': 'Festa Junina',
    '5-6': 'Maria',
    '5-13': 'Fim do Homem',
    '5-20': 'Novíssimos',
    '5-27': '4ª Vivência de Cursistas',
    '5-28': '4ª Formação de Servos',
    '5-30': 'Intercessão',
    '6-4': 'Ser Igreja',
    '6-12': 'Remissão dos Pecados',
    '6-18': 'Confra Fim de Semestre',
    '6-19': 'Férias',
    '6-25': 'Férias',
    '7-2': 'Férias',
    '7-8': 'Luau',
    '7-9': 'Dia dos Pais',
    '7-15': 'Relacionamento com Deus',
    '7-22': '5ª Vivência de Cursistas',
    '7-23': '5ª Formação de Servos',
    '7-25': 'Intercessão',
    '7-29': 'Relacionamento Consigo',
    '8-5': 'Relacionamento com o Próximo',
    '8-9': 'Círio',
    '8-10': 'Círio',
    '8-11': 'Círio',
    '8-12': 'Círio',
    '8-19': 'Relacionamento Familiar',
    '8-26': '6ª Vivência de Cursistas',
    '8-27': '6ª Formação de Servos',
    '9-3': 'Castidade',
    '9-10': 'Drogas / Vício',
    '9-17': 'Vocação',
    '9-24': '7ª Vivência de Cursistas',
    '9-25': 'Redes Sociais',
    '9-27': 'Intercessão',
    '10-1': 'Chamado à Santidade',
    '10-7': 'Adoração Santíssimo',
    '10-8': 'Viver em Comunidade',
    '10-14': 'Missa Parte a Parte',
    '10-21': 'Querigma',
    '10-28': 'Projeto Ágape',
    '11-5': 'Retiro de Servos',
    '11-12': 'Confra Fim de Ano'
};

export function initCalendar() {
    if (!calendarGrid) return;
    renderCalendar();
    addNavigationButtons();
    addInstructionMessage();
}

function addNavigationButtons() {
    const header = document.querySelector('#modalCalendario .modal-header');
    if (!header || header.querySelector('.nav-btn')) return;

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<span class="material-symbols-rounded">chevron_left</span>';
    prevBtn.className = 'nav-btn';
    prevBtn.onclick = () => changeMonth(-1);

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<span class="material-symbols-rounded">chevron_right</span>';
    nextBtn.className = 'nav-btn';
    nextBtn.onclick = () => changeMonth(1);

    const closeBtn = header.querySelector('.close-modal');

    // Inserção na ordem visual correta: < Título > X
    header.insertBefore(prevBtn, currentMonthElement);
    header.insertBefore(nextBtn, closeBtn);
}

function addInstructionMessage() {
    if(document.getElementById('msg-instrucao-cal')) return;
    const msg = document.createElement('p');
    msg.id = 'msg-instrucao-cal';
    msg.innerText = "Toque em um dia para ver os eventos.";
    calendarGrid.parentNode.insertBefore(msg, eventosContainer);
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    calendarGrid.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthElement.innerText = `${monthNames[month]} ${year}`;

    dayNames.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-header-day';
        div.textContent = day;
        calendarGrid.appendChild(div);
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDayIndex; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        calendarGrid.appendChild(div);
    }

    for (let i = 1; i <= lastDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = i;

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('today');
        }

        const eventKey = `${month}-${i}`;
        if (agapeEvents[eventKey]) {
            div.classList.add('has-event');
        }

        div.onclick = () => {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            div.classList.add('selected');
            showEventsForDay(i, month, year);
        };
        calendarGrid.appendChild(div);
    }
}

function showEventsForDay(day, month, year) {
    const dateStr = `${day}/${month + 1}/${year}`;
    const eventKey = `${month}-${day}`;
    
    let html = `<h4 style="margin: 5px 0; color:var(--primary); font-size: 0.9rem;">${dateStr}</h4>`;
    
    if (agapeEvents[eventKey]) {
        // Usa a classe CSS .evento-card que definimos no CSS agora
        html += `
            <div class="evento-card">
                <strong>${agapeEvents[eventKey]}</strong>
            </div>
        `;
    } else {
        html += `<p style="color: var(--muted); font-size: 0.8rem;">Nenhum evento especial.</p>`;
    }

    const msg = document.getElementById('msg-instrucao-cal');
    if(msg) msg.style.display = 'none';

    eventosContainer.innerHTML = html;
}