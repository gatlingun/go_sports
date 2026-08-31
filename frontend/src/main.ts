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
const gamesLoading = document.getElementById("games-loading");
const gameNavigator = document.getElementById("game-navigator");
const gameWeek = document.getElementById("game-week");
const gamePosition = document.getElementById("game-position");
const gameDate = document.getElementById("game-date") as HTMLTimeElement | null;
const gameStatus = document.getElementById("game-status");
const awayTeam = document.getElementById("away-team");
const awayLogo = document.getElementById("away-logo") as HTMLImageElement | null;
const awayScore = document.getElementById("away-score");
const homeTeam = document.getElementById("home-team");
const homeLogo = document.getElementById("home-logo") as HTMLImageElement | null;
const homeScore = document.getElementById("home-score");
const gameVenue = document.getElementById("game-venue");
const previousGameButton = document.getElementById("previous-game") as HTMLButtonElement | null;
const nextGameButton = document.getElementById("next-game") as HTMLButtonElement | null;

let favoriteTeam: HTMLButtonElement | null = null;
let currentTeamGames: NflGamesResponse | null = null;
let scheduleGames: NflGame[] = [];
let currentGameIndex = 0;
let gamesRequestId = 0;

interface NflGamesResponse {
    data: NflGame[];
    meta?: Record<string, unknown>;
}

interface NflTeam {
    abbreviation: string;
    full_name: string;
}

interface NflGame {
    id: number;
    date: string;
    season: number;
    week: number;
    venue: string | null;
    status: string;
    status_state: string;
    home_team: NflTeam;
    visitor_team: NflTeam;
    home_team_score: number | null;
    visitor_team_score: number | null;
}

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
            void loadTeamGames(team);
            closeFavoriteMenu();
            favoriteTrigger?.focus();
        });
        favoriteOptions?.append(option);
    });
}

document.querySelectorAll<HTMLButtonElement>(".team-chip").forEach((team) => {
    team.addEventListener("click", () => {
        setSelectedTeam(team);
        void loadTeamGames(team);
    });
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
    void loadTeamGames(initialTeam);
}

healthButton?.addEventListener("click", checkHealth);
previousGameButton?.addEventListener("click", () => showGameAt(currentGameIndex - 1));
nextGameButton?.addEventListener("click", () => showGameAt(currentGameIndex + 1));

async function checkHealth(): Promise<void> {
    try {
        const response = await fetch("/health");
        const data = await response.json();

        if (healthStatus) {
            healthStatus.textContent = `Backend status: ${data.status}`;
        }

        if (!response.ok) {
            console.warn(`Backend health check returned HTTP ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to check backend health:", error);

        if (healthStatus) {
            healthStatus.textContent = "Backend is unavailable";
        }
    }
}

checkHealth()

async function loadTeamGames(team: HTMLButtonElement): Promise<void> {
    const teamAbbreviation = team.dataset.teamId;
    if (!teamAbbreviation) {
        return;
    }

    const requestId = ++gamesRequestId;
    showScheduleLoading();
    try {
        const response = await fetch(`/nfl_games?team=${encodeURIComponent(teamAbbreviation)}`);
        const payload: unknown = await response.json();
        if (!response.ok) {
            throw new Error(getGamesErrorMessage(payload, response.status));
        }
        if (requestId !== gamesRequestId) {
            return;
        }

        currentTeamGames = payload as NflGamesResponse;
        scheduleGames = currentTeamGames.data
            .filter((game) => game.season === 2026)
            .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime());
        currentGameIndex = getFirstUpcomingGameIndex(scheduleGames);
        renderCurrentGame();
        console.info("NFL games loaded", { team: teamAbbreviation, games: currentTeamGames });
        document.dispatchEvent(new CustomEvent("nfl-games-loaded", {
            detail: { team: teamAbbreviation, games: currentTeamGames },
        }));
    } catch (error) {
        if (requestId !== gamesRequestId) {
            return;
        }
        currentTeamGames = null;
        scheduleGames = [];
        showScheduleMessage("Schedule unavailable", "We couldn’t load this team’s 2026 games.");
        console.error(`Failed to load games for ${teamAbbreviation}:`, error);
        document.dispatchEvent(new CustomEvent("nfl-games-load-failed", {
            detail: { team: teamAbbreviation, error },
        }));
    }
}

function getFirstUpcomingGameIndex(games: NflGame[]): number {
    const now = Date.now();
    const nextGameIndex = games.findIndex((game) => new Date(game.date).getTime() >= now);
    return nextGameIndex === -1 ? Math.max(games.length - 1, 0) : nextGameIndex;
}

function renderCurrentGame(): void {
    if (scheduleGames.length === 0) {
        showScheduleMessage("No games found", "There are no 2026 games available for this team yet.");
        return;
    }

    const game = scheduleGames[currentGameIndex];
    if (!game) {
        return;
    }

    gamesLoading?.setAttribute("hidden", "");
    gameNavigator?.removeAttribute("hidden");
    if (gameWeek) {
        gameWeek.textContent = `Week ${game.week}`;
    }
    if (gamePosition) {
        gamePosition.textContent = `${currentGameIndex + 1} of ${scheduleGames.length}`;
    }
    if (gameDate) {
        const date = new Date(game.date);
        gameDate.dateTime = game.date;
        gameDate.textContent = new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
        }).format(date);
    }
    if (gameStatus) {
        gameStatus.textContent = game.status;
    }
    if (awayTeam) {
        awayTeam.textContent = game.visitor_team.full_name;
    }
    setMatchupLogo(awayLogo, game.visitor_team);
    if (homeTeam) {
        homeTeam.textContent = game.home_team.full_name;
    }
    setMatchupLogo(homeLogo, game.home_team);

    const isFinal = game.status_state === "final";
    if (awayScore) {
        awayScore.textContent = isFinal && game.visitor_team_score !== null ? String(game.visitor_team_score) : "";
    }
    if (homeScore) {
        homeScore.textContent = isFinal && game.home_team_score !== null ? String(game.home_team_score) : "";
    }
    if (gameVenue) {
        gameVenue.textContent = game.venue ?? "Venue to be announced";
    }
    if (previousGameButton) {
        previousGameButton.disabled = currentGameIndex === 0;
    }
    if (nextGameButton) {
        nextGameButton.disabled = currentGameIndex === scheduleGames.length - 1;
    }
}

function showGameAt(index: number): void {
    if (index < 0 || index >= scheduleGames.length) {
        return;
    }
    currentGameIndex = index;
    renderCurrentGame();
}

function showScheduleLoading(): void {
    scheduleGames = [];
    gameNavigator?.setAttribute("hidden", "");
    gamesLoading?.removeAttribute("hidden");
    if (gamesLoading) {
        gamesLoading.innerHTML = "<span class=\"placeholder-date\">LOADING</span><strong>Schedule loading</strong><span>Getting this team’s 2026 games</span>";
    }
}

function setMatchupLogo(logo: HTMLImageElement | null, team: NflTeam): void {
    if (!logo) {
        return;
    }

    logo.src = `/assets/team-logos/${team.abbreviation.toLowerCase()}.png`;
    logo.alt = `${team.full_name} logo`;
    logo.onerror = () => {
        logo.hidden = true;
    };
    logo.hidden = false;
}

function showScheduleMessage(title: string, detail: string): void {
    gameNavigator?.setAttribute("hidden", "");
    gamesLoading?.removeAttribute("hidden");
    if (gamesLoading) {
        gamesLoading.innerHTML = `<span class="placeholder-date">2026 SEASON</span><strong>${title}</strong><span>${detail}</span>`;
    }
}

function getGamesErrorMessage(payload: unknown, status: number): string {
    if (typeof payload === "object" && payload !== null && "error" in payload) {
        const error = (payload as { error?: unknown }).error;
        if (typeof error === "string") {
            return error;
        }
    }
    return `HTTP ${status}`;
}
