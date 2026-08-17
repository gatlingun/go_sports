const healthButton = document.getElementById("health-button");
const healthStatus = document.getElementById("health-status");

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
