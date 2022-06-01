function novoElemento(tagName, className, content) {
    const elem = document.createElement(tagName);
    elem.className = className;
    if (content) elem.innerHTML = content;
    return elem;
}

function Barreira(reversa = false) {
    this.elemento = novoElemento("div", "barreira");

    const borda = novoElemento("div", "borda");
    const corpo = novoElemento("div", "corpo");
    this.elemento.appendChild(reversa ? corpo : borda);
    this.elemento.appendChild(reversa ? borda : corpo);

    this.setAltura = altura => corpo.style.height = `${altura}px`;
}

function ParDeBarreiras(altura, abertura, x) {
    this.elemento = novoElemento("div", "par-de-barreiras");

    this.superior = new Barreira(true);
    this.inferior = new Barreira(false);

    this.elemento.appendChild(this.superior.elemento);
    this.elemento.appendChild(this.inferior.elemento);

    this.sortearAbertura = () => {
        const alturaSuperior = Math.random() * (altura - abertura);
        const alturaInferior = altura - abertura - alturaSuperior;
        this.superior.setAltura(alturaSuperior);
        this.inferior.setAltura(alturaInferior);
    };

    this.getX = () => parseInt(this.elemento.style.left.split("px")[0]);
    this.setX = x => this.elemento.style.left = `${x}px`;
    this.getLargura = () => this.elemento.clientWidth;

    this.sortearAbertura();
    this.setX(x);
}

function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco),
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3),
        new ParDeBarreiras(altura, abertura, largura + espaco * 4),
        new ParDeBarreiras(altura, abertura, largura + espaco * 5),
        new ParDeBarreiras(altura, abertura, largura + espaco * 6),
        new ParDeBarreiras(altura, abertura, largura + espaco * 7),
        new ParDeBarreiras(altura, abertura, largura + espaco * 8),
    ];

    const deslocamento = 3;
    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento);

            if (par.getX() < -par.getLargura()) {
                par.setX(par.getX() + espaco * this.pares.length);
                par.sortearAbertura();
            }

            const meio = largura / 2;
            const cruzouOMeio = par.getX() + deslocamento >= meio && par.getX() < meio;
            if (cruzouOMeio) notificarPonto();
        });
    };
}

function Passaro(alturaJogo) {
    let voando = false;
    this.elemento = novoElemento("img", "passaro");
    this.elemento.src = "img/passaro.png";

    this.getY = () => parseInt(this.elemento.style.bottom.split("px")[0]);
    this.setY = y => this.elemento.style.bottom = `${y}px`;

    window.onkeydown = e => voando = true;
    window.onkeyup = e => voando = false;
    window.ontouchstart = e => voando = true;
    window.ontouchend = e => voando = false;

    this.animar = () => {
        const novoY = this.getY() + (voando ? 8 : -5);
        const alturaMaxima = alturaJogo - this.elemento.clientHeight;
        if (novoY <= 0) {
            this.setY(0);
        } else if (novoY >= alturaMaxima) {
            this.setY(alturaMaxima);
        } else {
            this.setY(novoY);
        }
    };

    this.setY(alturaJogo / 2);
}

function Progresso() {
    this.elemento = novoElemento("span", "progresso");
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos;
    };
    this.atualizarPontos(0);
}

function Nuvem() {
    this.elemento = novoElemento("img", "nuvem");
    this.elemento.src = "img/nuvens.png";
}

function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect();
    const b = elementoB.getBoundingClientRect();

    const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left;
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top;
    return horizontal && vertical;
}

function colidiu(passaro, barreiras) {
    let colidiu = false;
    barreiras.pares.forEach(parDeBarreiras => {
        if (!colidiu) {
            const superior = parDeBarreiras.superior.elemento;
            const inferior = parDeBarreiras.inferior.elemento;
            colidiu = estaoSobrepostos(passaro.elemento, superior) || estaoSobrepostos(passaro.elemento, inferior);
        }
    });
    return colidiu;
}

function GameOver(pontos) {
    this.elemento = novoElemento("div", "game-over");
    this.elemento.appendChild(novoElemento("h1", "game-over-title", "Game Over"));
    if (pontos == 0) {
        this.elemento.appendChild(novoElemento("div", "points-text", "Você não conseguiu nenhum ponto"));
    } else if (pontos == 1) {
        this.elemento.appendChild(novoElemento("div", "points-text", `Você fez <span>${pontos}</span> ponto!`));
    } else {
        this.elemento.appendChild(novoElemento("div", "points-text", `Você fez <span>${pontos}</span> pontos!`));
    }
    this.elemento.appendChild(novoElemento("div", "game-over-text", "<button class='play' onclick='play()'><i class='fas fa-redo-alt'></i></button>"));
}

function FlappyBird() {

    const areaDoJogo = document.querySelector("[cp-flappy]");
    areaDoJogo.innerHTML = "";


    this.start = () => {
        let pontos = 0;

        const areaDoJogo = document.querySelector("[cp-flappy]");
        const altura = areaDoJogo.clientHeight;
        const largura = areaDoJogo.clientWidth;

        const progresso = new Progresso();
        const barreiras = new Barreiras(altura, largura, 250, 400, () => progresso.atualizarPontos(++pontos));
        const passaro = new Passaro(altura);
        const nuvem = new Nuvem();

        areaDoJogo.appendChild(progresso.elemento);
        areaDoJogo.appendChild(passaro.elemento);
        barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento));
        areaDoJogo.appendChild(nuvem.elemento);

        const temporizador = setInterval(() => {
            barreiras.animar();
            passaro.animar();

            if (colidiu(passaro, barreiras)) {
                clearInterval(temporizador);
                const areaDoJogo = document.querySelector("[cp-flappy]");
                areaDoJogo.innerHTML = "";
                areaDoJogo.appendChild(new GameOver(pontos).elemento);
            }
        }, 20);
    };
}

function play() {
    new FlappyBird().start();
}