const healthButton = document.getElementById("health-button");
const healthStatus = document.getElementById("health-status");
const teamSlider = document.getElementById("team-slider");
const favoriteTrigger = document.getElementById("favorite-trigger") as HTMLButtonElement | null;
const favoriteMenu = document.getElementById("favorite-menu");
const favoriteOptions = document.getElementById("favorite-team-options");
const favoriteMark = document.getElementById("favorite-mark");
const favoriteLogo = document.getElementById("favorite-logo") as HTMLImageElement | null;
const favoriteName = document.getElementById("favorite-name");
const favoriteTeamStorageKey = "go-sports.favorite-team";

let favoriteTeam: HTMLButtonElement | null = null;

function setSelectedTeam(team: HTMLButtonElement): void {
    document.querySelectorAll<HTMLButtonElement>(".team-chip").forEach((chip) => {
        const isSelected = chip === team;
        chip.classList.toggle("team-chip--active", isSelected);
        chip.setAttribute("aria-pressed", String(isSelected));
    });
}

function setFavoriteTeam(team: HTMLButtonElement, shouldPersist = true): void {
    favoriteTeam = team;
    const mark = team.querySelector<HTMLElement>(".team-mark");
    const logo = team.querySelector<HTMLImageElement>("img");
    const name = team.querySelector(".team-name")?.textContent ?? team.getAttribute("aria-label") ?? "Team";

    if (mark && favoriteMark) {
        favoriteMark.className = mark.className;
    }
    if (logo && favoriteLogo) {
        favoriteLogo.src = logo.src;
    }
    if (favoriteName) {
        favoriteName.textContent = name;
    }

    teamSlider?.prepend(team);
    teamSlider?.scrollTo({ left: 0, behavior: "smooth" });
    setSelectedTeam(team);
    updateFavoriteOptions();
    if (shouldPersist) {
        saveFavoriteTeam(team.dataset.teamId);
    }
}

function saveFavoriteTeam(teamId: string | undefined): void {
    if (!teamId) {
        return;
    }

    try {
        localStorage.setItem(favoriteTeamStorageKey, teamId);
    } catch (error) {
        console.warn("Unable to save favorite team:", error);
    }
}

function getSavedFavoriteTeam(): HTMLButtonElement | null {
    try {
        const teamId = localStorage.getItem(favoriteTeamStorageKey);
        return Array.from(document.querySelectorAll<HTMLButtonElement>(".team-chip"))
            .find((team) => team.dataset.teamId === teamId) ?? null;
    } catch (error) {
        console.warn("Unable to read favorite team:", error);
        return null;
    }
}

function updateFavoriteOptions(): void {
    favoriteOptions?.querySelectorAll<HTMLButtonElement>(".favorite-option").forEach((option) => {
        option.setAttribute("aria-pressed", String(option.dataset.teamId === favoriteTeam?.dataset.teamId));
    });
}

function closeFavoriteMenu(): void {
    favoriteMenu?.setAttribute("hidden", "");
    favoriteTrigger?.setAttribute("aria-expanded", "false");
}

function buildFavoriteOptions(): void {
    const teams = document.querySelectorAll<HTMLButtonElement>(".team-chip");

    teams.forEach((team) => {
        const option = document.createElement("button");
        const mark = team.querySelector<HTMLElement>(".team-mark");
        const logo = team.querySelector<HTMLImageElement>("img");
        const teamName = team.getAttribute("aria-label") ?? "Team";

        option.type = "button";
        option.className = "favorite-option";
        option.dataset.teamName = teamName;
        option.dataset.teamId = team.dataset.teamId;
        option.setAttribute("role", "listitem");
        option.setAttribute("aria-label", `Set ${teamName} as favorite`);
        option.setAttribute("aria-pressed", "false");

        if (mark && logo) {
            const optionMark = mark.cloneNode(false) as HTMLSpanElement;
            const optionLogo = logo.cloneNode() as HTMLImageElement;
            optionLogo.alt = "";
            optionMark.append(optionLogo);
            option.append(optionMark);
        }

        option.addEventListener("click", () => {
            setFavoriteTeam(team);
            closeFavoriteMenu();
            favoriteTrigger?.focus();
        });
        favoriteOptions?.append(option);
    });
}

document.querySelectorAll<HTMLButtonElement>(".team-chip").forEach((team) => {
    team.addEventListener("click", () => setSelectedTeam(team));
});

favoriteTrigger?.addEventListener("click", () => {
    const isOpen = favoriteTrigger.getAttribute("aria-expanded") === "true";
    if (isOpen) {
        closeFavoriteMenu();
        return;
    }
    favoriteMenu?.removeAttribute("hidden");
    favoriteTrigger.setAttribute("aria-expanded", "true");
    favoriteOptions?.querySelector<HTMLButtonElement>(".favorite-option[aria-pressed='true']")?.focus();
});

document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !document.querySelector(".favorite-picker")?.contains(event.target)) {
        closeFavoriteMenu();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeFavoriteMenu();
        favoriteTrigger?.focus();
    }
});

buildFavoriteOptions();
const savedFavoriteTeam = getSavedFavoriteTeam();
const initialTeam = savedFavoriteTeam ?? document.querySelector<HTMLButtonElement>(".team-chip--active");
if (initialTeam) {
    setFavoriteTeam(initialTeam, savedFavoriteTeam !== null);
}

healthButton?.addEventListener("click", checkHealth);

async function checkHealth(): Promise<void> {
    try {
        const response = await fetch("/health");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (healthStatus) {
            healthStatus.textContent = `Backend status: ${data.status}`;
        }
    } catch (error) {
        console.error("Failed to check backend health:", error);

        if (healthStatus) {
            healthStatus.textContent = "Backend is unavailable";
        }
    }
}

checkHealth()
