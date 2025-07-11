Hooks.on("init", () => {
    console.log("Module Combat UI Fusionné chargé ");
});

// Vérifie si un combat est déjà en cours au chargement de Foundry
Hooks.on("ready", () => {
    if (game.combat?.started) {
        activateCombatUI();
    }
});

// Détecte quand le combat commence (et pas juste quand il est créé)
Hooks.on("updateCombat", (combat, changes) => {
    if (changes.hasOwnProperty("round") && combat.round === 1) {
        activateCombatUI();
    }
});

let previousHP = new Map();

function activateCombatUI() {
    ui.notifications.info("Affichage des dégâts et bannière activés !");
    
    if (!document.querySelector("#combatBanner")) {
        let banner = document.createElement("div");
        banner.id = "combatBanner";
        banner.style = `
            position: fixed;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            background-color: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            width: 400px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 1s ease-in-out, visibility 1s ease-in-out;
        `;
        banner.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 10px;">Tour <span id="roundNumber">1</span></div>
            <img id="combatantImage" src="" style="display: block; margin: 10px auto; border-radius: 50%; border: 5px solid white; width: 100px; height: 100px; object-fit: cover;" />
            <div style="font-size: 36px; font-weight: bold; margin-top: 10px;" id="combatantName">Joueur</div>
            <div style="font-size: 18px; margin-top: 5px;">Prochain : <span id="nextCombatant">???</span></div>
        `;
        document.body.appendChild(banner);
    }

    canvas.tokens.placeables.forEach(token => {
        if (token.actor) {
            previousHP.set(token.id, token.actor.system?.health?.value ?? 0);
        }
    });

    Hooks.on("updateActor", (actor, data) => {
        const token = canvas.tokens.placeables.find(t => t.actor === actor);
        if (!token) return;

        let oldHP = previousHP.get(token.id) ?? (actor.system?.health?.value ?? 0);
        let newHP = actor.system?.health?.value ?? 0;

        if (newHP < oldHP) {
            showFloatingText(token, `💀 -${oldHP - newHP}`, "#ff0000");
        } else if (newHP > oldHP) {
            showFloatingText(token, `💖 +${newHP - oldHP}`, "#00ff00");
        }

        previousHP.set(token.id, newHP);
    });

    Hooks.on("updateCombat", updateBanner);
    Hooks.on("deleteCombat", cleanupCombatUI);

    updateBanner();
}

function showFloatingText(token, value, color) {
    const textStyle = new PIXI.TextStyle({
        fontSize: 24,
        fill: color,
        stroke: "#000000",
        strokeThickness: 3,
        fontWeight: "bold"
    });

    let floatingText = new PIXI.Text(value, textStyle);
    floatingText.anchor.set(0.5);
    floatingText.x = token.w / 2;
    floatingText.y = -20;

    let container = new PIXI.Container();
    container.addChild(floatingText);
    token.addChild(container);

    let ticker = new PIXI.Ticker();
    ticker.add(() => {
        floatingText.y -= 0.5;
        floatingText.alpha -= 1 / 100;
    });
    ticker.start();

    setTimeout(() => {
        ticker.stop();
        token.removeChild(container);
        container.destroy();
    }, 3000);
}

function updateBanner() {
    if (!game.combat) {
        cleanupCombatUI();
        return;
    }

    const currentCombatant = game.combat.combatant;
    const nextCombatant = game.combat.nextCombatant;

    document.getElementById("roundNumber").innerText = game.combat.round;
    document.getElementById("combatantName").innerText = currentCombatant?.name || "Inconnu";
    document.getElementById("combatantImage").src = canvas.tokens.get(currentCombatant?.tokenId)?.document.texture.src || "";
    document.getElementById("nextCombatant").innerText = nextCombatant?.name || "???";

    const banner = document.getElementById("combatBanner");
    banner.style.opacity = "1";
    banner.style.visibility = "visible";

    setTimeout(() => {
        banner.style.opacity = "0";
        banner.style.visibility = "hidden";
    }, 6000);
}

function cleanupCombatUI() {
    Hooks.off("updateCombat", updateBanner);
    Hooks.off("updateActor");
    Hooks.off("deleteCombat", cleanupCombatUI);

    let banner = document.getElementById("combatBanner");
    if (banner) banner.remove();
}






















  