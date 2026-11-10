
const canvas = document.getElementById("sketchCanvas");
const ctx = canvas.getContext("2d");

const revealButton = document.getElementById("revealButton");
const resetButton = document.getElementById("resetButton");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

const currentImageLabel = document.getElementById("currentImage");
const totalImagesLabel = document.getElementById("totalImages");

const progressBar = document.getElementById("progressBar");
const statusText = document.getElementById("status");
const placeholder = document.getElementById("placeholder");

const leftMessage = document.getElementById("leftMessage");
const rightMessage = document.getElementById("rightMessage");

// =====================================
// CONFIGURACIÓN
// =====================================

const imageFiles = [
    "assets/sketch-1.png",
    "assets/sketch-2.png",
    "assets/sketch-3.png",
    "assets/sketch-4.png",
    "assets/sketch-5.png",
    "assets/sketch-6.png"
];

const imageMessages = [
    {
        left: `En este museo se conservan obras inspiradas en una antigua musa griega, una mujer cuya belleza habría fascinado a generaciones de artistas, todos intentando capturar aquello que la hacía extraordinaria.

Nuestra primera interpretación es un Realismo pictórico clásico.`
,
        right: `El realismo clásico no necesita exagerar para conmover. Su belleza reside en la precisión, en las proporciones y en la paciencia de reproducir cada detalle.
Esta obra recuerda a los grandes retratistas de otras épocas, aquellos que entendían que un buen retrato no consistía solamente en reproducir un rostro, sino en conservar algo de la esencia de quien posaba.

Y si algo merece ser contemplado sin prisas, es precisamente aquello que el tiempo nunca debería llevarse.`


    },
    {
        left: `Hay recuerdos que parecen tener su propia luz. En esta obra, el artista recurre al impasto, construyendo volumen y textura con pinceladas que casi pueden sentirse al tacto.

El realismo permite reconocer cada detalle, mientras que la materia de la pintura le concede algo más: profundidad, calidez y presencia.

Es curioso cómo una escena cotidiana puede convertirse en algo digno de permanecer para siempre. Tal vez porque algunas personas tienen esa capacidad: hacer extraordinario hasta el momento más sencillo.`,
        right: ""
    },
    {
        left: "",
        right: `Monet alguna vez nos enseñó que la luz podía transformar por completo aquello que observamos. Pero esta interpretación va un poco más allá: no pretende únicamente retratar una figura, sino transmitir lo que provoca contemplarla.

Las pinceladas son libres, los colores adquieren personalidad y las formas parecen cobrar vida entre la emoción y la espontaneidad.

Porque hay miradas que no necesitan demasiados detalles para convertirse en arte. Basta un instante para entender por qué alguien podría pasar horas intentando reproducirlas.`
    },
    {
        left: `A diferencia de otras corrientes, en el Oleo impresionista contemporáneo la luz no busca obedecer a la realidad, sino jugar con ella; los reflejos, los colores y cada pincelada intentan capturar un instante que, por su naturaleza, jamás podría repetirse.

Quizá esa sea la verdadera dificultad de retratarla: no es solamente su belleza lo que merece ser pintado, sino la sensación de contemplarla.`,
        right: ""
    },
    {
        left: "",
        right: `El expresionismo nunca tuvo como propósito reproducir el mundo exactamente como lo vemos, sino interpretarlo a través de las emociones. Sus colores, contrastes y trazos revelan aquello que las palabras muchas veces no consiguen explicar.

Tal vez por eso esta sea la obra más difícil de describir: porque cuando la belleza deja de ser solamente algo que observamos y se convierte en algo que sentimos, cualquier intento de explicarla parece insuficiente.`
    },
    {
        left: `Renoir encontraba belleza en los momentos más sencillos de la vida: una sonrisa, una reunión, una mirada iluminada por el sol.

Esta interpretación sigue esa misma sensibilidad. Las pinceladas suaves, los tonos cálidos y la luz envolvente convierten el retrato en algo más que una representación: lo transforman en un recuerdo.

Quizá por eso algunas personas parecen pertenecer a una pintura romántica. No porque su belleza sea perfecta, sino porque incluso el recuerdo de haberlas conocido puede sentirse como uno.`,
        right: `Y así termina nuestra exposición, aunque quizá no nuestra historia.

Seis interpretaciones, seis maneras de representar a una misma musa y una infinidad de detalles que ninguna pintura podría terminar de capturar.

Al final, creo que todos los artistas compartimos el mismo problema: podemos cambiar los colores, las técnicas y los lienzos, pero seguimos intentando representar algo que, sencillamente, nos parece imposible de superar.`
    }
];

const DURATION = 3000;
const STROKE_COUNT = 2400;

// =====================================
// ESTADO
// =====================================

let images = [];
let currentIndex = 0;

let strokes = [];
let drawnCount = 0;

let animationId = null;
let startTime = null;

let isRunning = false;
let isFinished = false;

let imageArea = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
};

// =====================================
// CAPAS AUXILIARES
// =====================================

const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");

const revealedCanvas = document.createElement("canvas");
const revealedCtx = revealedCanvas.getContext("2d");

// =====================================
// MENSAJES LATERALES
// =====================================

function showMessages() {
    const message = imageMessages[currentIndex] || {
        left: "",
        right: ""
    };

    if (leftMessage) {
        leftMessage.querySelector("p").textContent = message.left;
        leftMessage.classList.toggle("visible", !!message.left);
    }

    if (rightMessage) {
        rightMessage.querySelector("p").textContent = message.right;
        rightMessage.classList.toggle("visible", !!message.right);
    }
}

function hideMessages() {
    leftMessage?.classList.remove("visible");
    rightMessage?.classList.remove("visible");
}

// =====================================
// CARGAR IMÁGENES
// =====================================

function loadImages() {
    totalImagesLabel.textContent =
        String(imageFiles.length).padStart(2, "0");

    statusText.textContent = "LOADING IMAGES...";

    const promises = imageFiles.map(src => {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);

            img.onerror = () => {
                reject(new Error("Cannot load: " + src));
            };

            img.src = src;
        });
    });

    Promise.all(promises)
        .then(loadedImages => {
            images = loadedImages;
            showImage(0);
        })
        .catch(error => {
            console.error(error);

            statusText.textContent = "IMAGE LOADING ERROR";
            revealButton.disabled = true;
            resetButton.disabled = true;
            prevButton.disabled = true;
            nextButton.disabled = true;
        });
}

// =====================================
// MOSTRAR IMAGEN SELECCIONADA
// =====================================

function showImage(index) {
    if (index < 0 || index >= images.length) return;

    hideMessages();

    cancelAnimationFrame(animationId);
    animationId = null;

    isRunning = false;
    isFinished = false;

    drawnCount = 0;
    startTime = null;

    currentIndex = index;

    const img = images[currentIndex];

    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);

    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;

    revealedCanvas.width = canvas.width;
    revealedCanvas.height = canvas.height;

    // Ajustar imagen manteniendo sus proporciones
    const ratio = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
    );

    imageArea.w = img.width * ratio;
    imageArea.h = img.height * ratio;

    imageArea.x = (canvas.width - imageArea.w) / 2;
    imageArea.y = (canvas.height - imageArea.h) / 2;

    // Limpiar capas
    maskCtx.clearRect(
        0, 0,
        maskCanvas.width,
        maskCanvas.height
    );

    revealedCtx.clearRect(
        0, 0,
        revealedCanvas.width,
        revealedCanvas.height
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generar nuevas pinceladas
    generateStrokes();

    // Actualizar contador
    currentImageLabel.textContent =
        String(currentIndex + 1).padStart(2, "0");

    // Actualizar navegación
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === images.length - 1;

    // Restablecer interfaz
    placeholder.style.display = "flex";

    progressBar.style.width = "0%";

    statusText.textContent = "READY TO REVEAL";

    revealButton.disabled = false;
    resetButton.disabled = true;
}

// =====================================
// GENERAR PINCELADAS
// =====================================

function generateStrokes() {
    strokes = [];

    for (let i = 0; i < STROKE_COUNT; i++) {
        const x = imageArea.x +
            Math.random() * imageArea.w;

        const y = imageArea.y +
            Math.random() * imageArea.h;

        const angle =
            (Math.random() - 0.5) * Math.PI;

        const length =
            20 + Math.random() * 100;

        const width =
            3 + Math.random() * 13;

        const endX =
            x + Math.cos(angle) * length;

        const endY =
            y + Math.sin(angle) * length;

        const curve =
            (Math.random() - 0.5) * 35;

        const controlX =
            (x + endX) / 2 +
            Math.cos(angle + Math.PI / 2) * curve;

        const controlY =
            (y + endY) / 2 +
            Math.sin(angle + Math.PI / 2) * curve;

        strokes.push({
            x,
            y,
            endX,
            endY,
            controlX,
            controlY,
            width
        });
    }

    // Orden aleatorio
    strokes.sort(() => Math.random() - 0.5);
}

// =====================================
// DIBUJAR PINCELADA
// =====================================

function drawStroke(stroke) {
    maskCtx.beginPath();

    maskCtx.moveTo(stroke.x, stroke.y);

    maskCtx.quadraticCurveTo(
        stroke.controlX,
        stroke.controlY,
        stroke.endX,
        stroke.endY
    );

    maskCtx.strokeStyle = "#ffffff";
    maskCtx.lineWidth = stroke.width;
    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";

    maskCtx.stroke();

    // Textura secundaria
    maskCtx.beginPath();

    maskCtx.moveTo(stroke.x + 1, stroke.y + 1);

    maskCtx.lineTo(
        stroke.endX - 1,
        stroke.endY - 1
    );

    maskCtx.lineWidth =
        Math.max(1, stroke.width * 0.3);

    maskCtx.stroke();
}

// =====================================
// RENDERIZAR IMAGEN REVELADA
// =====================================

function render() {
    const img = images[currentIndex];

    revealedCtx.clearRect(
        0, 0,
        revealedCanvas.width,
        revealedCanvas.height
    );

    revealedCtx.drawImage(
        img,
        imageArea.x,
        imageArea.y,
        imageArea.w,
        imageArea.h
    );

    // Aplicar máscara de revelación
    revealedCtx.globalCompositeOperation =
        "destination-in";

    revealedCtx.drawImage(maskCanvas, 0, 0);

    revealedCtx.globalCompositeOperation =
        "source-over";

    // Fondo blanco
    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0, 0,
        canvas.width,
        canvas.height
    );

    ctx.drawImage(revealedCanvas, 0, 0);
}

// =====================================
// ANIMACIÓN
// =====================================

function animate(timestamp) {
    if (!isRunning) return;

    if (startTime === null) {
        startTime = timestamp;
    }

    const elapsed = timestamp - startTime;

    const progress = Math.min(
        elapsed / DURATION,
        1
    );

    const targetCount = Math.floor(
        progress * STROKE_COUNT
    );

    // Dibujar nuevas pinceladas
    for (let i = drawnCount; i < targetCount; i++) {
        drawStroke(strokes[i]);
    }

    drawnCount = targetCount;

    render();

    progressBar.style.width =
        (progress * 100) + "%";

    if (progress >= 1) {
        // Completar toda la imagen
        maskCtx.fillStyle = "#ffffff";

        maskCtx.fillRect(
            imageArea.x,
            imageArea.y,
            imageArea.w,
            imageArea.h
        );

        render();

        isRunning = false;
        isFinished = true;
        animationId = null;

        revealButton.disabled = false;
        resetButton.disabled = false;

        statusText.textContent = "REVEAL COMPLETED";

        // Mostrar mensajes al terminar
        showMessages();

        return;
    }

    animationId = requestAnimationFrame(animate);
}

// =====================================
// INICIAR REVELACIÓN
// =====================================

function startReveal() {
    if (isRunning || isFinished) return;

    cancelAnimationFrame(animationId);

    isRunning = true;

    hideMessages();

    placeholder.style.display = "none";

    revealButton.disabled = true;
    resetButton.disabled = true;

    statusText.textContent = "DRAWING IN PROGRESS...";

    animationId = requestAnimationFrame(animate);
}

// =====================================
// REINICIAR IMAGEN ACTUAL
// =====================================

function resetReveal() {
    cancelAnimationFrame(animationId);
    animationId = null;

    hideMessages();

    isRunning = false;
    isFinished = false;

    drawnCount = 0;
    startTime = null;

    maskCtx.clearRect(
        0, 0,
        maskCanvas.width,
        maskCanvas.height
    );

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0, 0,
        canvas.width,
        canvas.height
    );

    placeholder.style.display = "flex";

    progressBar.style.width = "0%";

    statusText.textContent = "READY TO REVEAL";

    revealButton.disabled = false;
    resetButton.disabled = true;
}

// =====================================
// NAVEGACIÓN
// =====================================

function previousImage() {
    if (currentIndex > 0) {
        showImage(currentIndex - 1);
    }
}

function nextImage() {
    if (currentIndex < images.length - 1) {
        showImage(currentIndex + 1);
    }
}

// =====================================
// EVENTOS
// =====================================

revealButton.addEventListener("click", startReveal);
resetButton.addEventListener("click", resetReveal);

prevButton.addEventListener("click", previousImage);
nextButton.addEventListener("click", nextImage);

// =====================================
// REDIMENSIONAR
// =====================================

window.addEventListener("resize", () => {
    if (!images.length) return;

    const wasFinished = isFinished;

    // Reconstruir el lienzo para el nuevo tamaño
    showImage(currentIndex);

    // Si ya había terminado, conservar el resultado
    if (wasFinished) {
        maskCtx.fillStyle = "#ffffff";

        maskCtx.fillRect(
            imageArea.x,
            imageArea.y,
            imageArea.w,
            imageArea.h
        );

        render();

        isFinished = true;

        placeholder.style.display = "none";

        revealButton.disabled = false;
        resetButton.disabled = false;

        progressBar.style.width = "100%";

        statusText.textContent = "REVEAL COMPLETED";

        // IMPORTANTE: recuperar también los mensajes
        showMessages();
    }
});

// =====================================
// INICIO
// =====================================

loadImages();
