const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const logicalSize = 400;
const dpr = window.devicePixelRatio || 1;   // Для чёткой картинки, тут просто плотность пикселей узнаём

let currentHistory = [];

canvas.width = logicalSize * dpr;
canvas.height = logicalSize * dpr;

canvas.style.width = logicalSize + 'px';
canvas.style.height = logicalSize + 'px';

ctx.scale(dpr, dpr);

const width = logicalSize;
const height = logicalSize;
const center = width / 2;
const scale = 36; // Уменьшили масштаб до 36, чтобы сетка от -5 до 5 идеально умещалась внутри холста

function drawShape(r) {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#3399FF';

    // первая четверть (сектор)
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, r * scale, -Math.PI / 2, 0, false);
    ctx.fill();

    // четвертая четверть (треугольник)
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + (r / 2) * scale, center); // вправо по x
    ctx.lineTo(center, center + r * scale);   //вниз по y
    ctx.closePath();
    ctx.fill();

    // третья четверть
    ctx.fillRect(center - r * scale, center, r * scale, r * scale);
}

function checkHit(x, y, r) {

    // Первая четверть
    if (x >= 0 && y >= 0) {
        return (x * x + y * y) <= (r * r);
    }

    // Вторая четверть
    if (x <= 0 && y >= 0) {
        return false;
    }

    // Третья четверть
    if (x <= 0 && y <= 0) {
        return (x >= -r) && (y >= -r);
    }

    // Четвёртая четверть
    if (x >= 0 && y <= 0) {
        return (x <= r / 2) && (y >= (2 * x - r));
    }
    return false;
}

// отрисовка осей
function drawAxes() {

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'black';
    ctx.font = '11px Arial';

    ctx.beginPath();

    // Ось X (внутри границ холста)
    ctx.moveTo(10, center);
    ctx.lineTo(width - 10, center);

    // Ось Y (внутри границ холста)
    ctx.moveTo(center, 10);
    ctx.lineTo(center, height - 10);

    // Стрелка оси X
    ctx.moveTo(width - 18, center - 4);
    ctx.lineTo(width - 10, center);
    ctx.lineTo(width - 18, center + 4);

    // Стрелка оси Y
    ctx.moveTo(center - 4, 18);
    ctx.lineTo(center, 10);
    ctx.lineTo(center + 4, 18);

    ctx.stroke(); // рисуем оси и стрелки

    const values = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

    values.forEach(val => {
        const pos = center + val * scale;

        ctx.beginPath();
        ctx.moveTo(pos, center - 3);
        ctx.lineTo(pos, center + 3);

        if (val !== 0) {
            ctx.fillText(val, pos - 4, center + 15);
        }

        ctx.moveTo(center - 3, center - val * scale);
        ctx.lineTo(center + 3, center - val * scale);

        if (val !== 0) {
            ctx.fillText(val, center + 6, center - val * scale + 4);
        }
        ctx.stroke();
    });

    // Подписываем оси и ноль внутри границ
    ctx.fillText("X", width - 5, center - 8);
    ctx.fillText("Y", center + 8, 18);
    ctx.fillText("0", center - 10, center + 14);
}

// Возвращает численное значение выбранного чекбокса
function getSelectedR() {
    const checked = document.querySelector('.r-checkbox:checked');
    return checked ? parseFloat(checked.value) : null
}

function updateTableFromServer(historyArray) {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = "";

    historyArray.forEach(item => {
        const newRow = tbody.insertRow(0);
        newRow.innerHTML = `
        <td>${item.x}</td>
        <td>${item.y}</td>
        <td>${item.r}</td>
        <td style="color: ${item.inside ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
          ${item.inside ? 'Попадание' : 'Промах'}
        </td>
        <td>${item.currentTime}</td>
        <td>${item.executionTimeMs.toFixed(3)} мс</td>
      `;
    });
}

// Отрисовывает точки на холсте
function drawPointsFromServer(historyArray, currentR) {
    if (!historyArray || !Array.isArray(historyArray)) return;

    historyArray.forEach(pt => {
        const xPx = center + Number(pt.x) * scale;
        const yPx = center - Number(pt.y) * scale;

        ctx.beginPath();
        ctx.arc(xPx, yPx, 4, 0, 2 * Math.PI);

        if (Number(pt.r) === Number(currentR)) {
            ctx.fillStyle = pt.inside ? '#27ae60' : '#e74c3c';
        } else {
            ctx.fillStyle = '#95a5a6';
        }

        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

// Функция обновления холста и отрисовки осей и точек в правильном порядке
function redrawCanvas(historyArray = currentHistory) {
    const r = getSelectedR();

    if (r) {
        drawShape(r);
    } else {
        ctx.clearRect(0, 0, width, height);
    }
    drawAxes();

    if (r) {
        const pointsToDraw = (historyArray && historyArray.length > 0) ? historyArray : currentHistory;
        drawPointsFromServer(pointsToDraw, r);
    }
}

const checkboxes = document.querySelectorAll('.r-checkbox');

// Слушатель всех чекбоксов, дабы нельзя было несколько галочек поставить за раз
checkboxes.forEach(cb => {
    cb.addEventListener('change', function() {
        if (this.checked) {
            // снимаем со всех галочки
            checkboxes.forEach(other => {
                if (other !== this) other.checked = false;
            });
        }
        redrawCanvas(currentHistory);
    });
});

redrawCanvas([]);

const form = document.getElementById('pointForm');

form.addEventListener('submit', function(event) {
    event.preventDefault();   // отменяет стандартную перезагрузку браузера

    const xVal = parseFloat(document.getElementById('x_val').value);

    const yStr = document.getElementById('y_val').value.trim().replace(',', '.');
    const yVal = parseFloat(yStr);
    const rVal = getSelectedR();

    // Валидация

    if (isNaN(yVal) || yVal <= -3 || yVal >= 5 || yStr === '') {
        alert('Ошибка ввода! Значение Y должно быть числом строго от -3 до 5.');
        return;
    }

    if (rVal === null) {
        alert('Ошибка! Пожалуйста, выберите радиус R.')
        return;
    }

    const url = `/fcgi-bin/hello-world.jar?x=${xVal}&y=${yVal}&r=${rVal}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {throw new Error(err.error || 'Ошибка сервера'); });
            }
            return response.json();
        })
        .then(data => {
            currentHistory = data.history;
            updateTableFromServer(currentHistory);
            redrawCanvas(currentHistory);
        })
        .catch(error => {
            alert("Ошибка связи с сервером: " + error.message);
        });
});

function loadHistory() {
    const url = `/fcgi-bin/hello-world.jar`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось загрузить историю с сервера');
            }
            return response.json();
        })
        .then(data => {
            if (data.history && data.history.length > 0) {
                currentHistory = data.history;
                updateTableFromServer(currentHistory);
                redrawCanvas(currentHistory);
            } else {
                redrawCanvas([]);
            }
        })
        .catch(error => {
            console.log("Пока нет истории на сервере или произошла ошибка:", error);
            redrawCanvas([]);
        });
}

loadHistory();
