document.addEventListener('DOMContentLoaded', () => {
    // API Endpoints
    const apiURL = 'https://blockchain.floodboy.online/blockchain/FloodBoy001';
    // Fallback CORS proxies if direct connection fails
    const corsProxyURL = 'https://api.allorigins.win/get?url=' + encodeURIComponent(apiURL);

    // DOM Elements
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('connection-status');
    const updateTimeEl = document.getElementById('last-updated');
    const locationEl = document.getElementById('location');
    const errorPanel = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const toggleRawBtn = document.getElementById('toggle-raw');
    const rawJsonPre = document.getElementById('raw-json');

    // Data Elements
    const waterCurrent = document.getElementById('water-current');
    const waterMin = document.getElementById('water-min');
    const waterMax = document.getElementById('water-max');
    const waterProgress = document.getElementById('water-progress');

    const batteryCurrent = document.getElementById('battery-current');
    const batteryMin = document.getElementById('battery-min');
    const batteryMax = document.getElementById('battery-max');
    const batteryProgress = document.getElementById('battery-progress');

    const dataCount = document.getElementById('data-count');

    // Simulate Fake Data matching exactly the user's provided structure
    const generateFallbackData = () => {
        return {
            "device_id": "FloodBoy001",
            "device_model": "HydroNode-X1",
            "battery_volt": {
                "min": 3.7,
                "current": 4.1,
                "max": 4.2
            },
            "water_depth": {
                "min": 15.2,
                "current": Math.floor(Math.random() * (40 - 20 + 1) + 20) + (Math.random().toFixed(1) * 1),
                "max": 120.5,
                "count": 14592
            },
            "timestamp": new Date().toISOString(),
            "status": "active"
        };
    };

    const updateUI = (data, isSimulated = false) => {
        // Update Status
        statusDot.className = 'status-dot';
        if (isSimulated) {
            statusDot.classList.add('error');
            statusText.textContent = 'Disconnected (Simulated Data)';
            errorPanel.classList.remove('hidden');
        } else {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected (Live Blockchain Data)';
            errorPanel.classList.add('hidden');
        }

        // Update basic info
        locationEl.textContent = data.device_model ? `Device: ${data.device_model}` : 'Location Unknown';

        // Handle Timestamp
        if (data.timestamp) {
            const date = new Date(data.timestamp);
            updateTimeEl.textContent = date.toLocaleString() + (isSimulated ? ' (Simulated)' : ' (Blockchain Time)');
        } else {
            updateTimeEl.textContent = new Date().toLocaleString() + ' (Local Time)';
        }

        // Update Water Depth
        const wDepth = data.water_depth || {};
        waterCurrent.textContent = (wDepth.current || 0).toFixed(1);
        waterMin.textContent = (wDepth.min || 0).toFixed(1) + ' cm';
        waterMax.textContent = (wDepth.max || 0).toFixed(1) + ' cm';

        // Calculate percentage for progress bar (assuming max 150cm for UI scale)
        const waterScaleMax = 150;
        const waterPrc = Math.min((wDepth.current / waterScaleMax) * 100, 100);
        waterProgress.style.width = `${waterPrc}%`;

        // Change color based on severity
        if (wDepth.current > 80) waterProgress.style.background = 'var(--danger-color)';
        else if (wDepth.current > 50) waterProgress.style.background = 'var(--warning-color)';
        else waterProgress.style.background = 'linear-gradient(90deg, var(--accent-blue), var(--accent-indigo))';

        // Update Battery
        const bVolt = data.battery_volt || {};
        batteryCurrent.textContent = (bVolt.current || 0).toFixed(2);
        batteryMin.textContent = (bVolt.min || 0).toFixed(1) + ' V';
        batteryMax.textContent = (bVolt.max || 0).toFixed(1) + ' V';

        // Calculate battery percentage (assuming 3.0V min, 4.2V max)
        const voltPrc = Math.max(0, Math.min(((bVolt.current - 3.0) / (4.2 - 3.0)) * 100, 100));
        batteryProgress.style.width = `${voltPrc}%`;

        if (voltPrc < 20) {
            batteryProgress.style.background = 'var(--danger-color)';
            batteryCurrent.style.color = 'var(--danger-color)';
        } else {
            batteryProgress.style.background = 'var(--success-color)';
            batteryCurrent.style.color = 'var(--text-primary)';
        }

        // Update System Stats
        dataCount.textContent = (wDepth.count || 0).toLocaleString();

        // Update Raw JSON
        rawJsonPre.textContent = JSON.stringify(data, null, 2);
    };

    const fetchData = async () => {
        try {
            statusText.textContent = 'Fetching...';
            // First try direct connection
            const response = await fetch(apiURL, { mode: 'cors' });

            if (!response.ok) throw new Error('Direct connection failed');

            const data = await response.json();

            // Check if stringified JSON was returned by mistake
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

            updateUI(parsedData, false);

        } catch (error) {
            console.warn('Direct fetch failed. This is likely due to CORS or Firewall blocks.', error);

            // Try via proxy URL
            try {
                const proxyResponse = await fetch(corsProxyURL);
                if (!proxyResponse.ok) throw new Error('Proxy connection failed');
                const proxyData = await proxyResponse.json();

                // allorigins wraps the response in a contents string
                const actualData = typeof proxyData.contents === 'string' ? JSON.parse(proxyData.contents) : proxyData.contents;
                updateUI(actualData, false);
            } catch (proxyError) {
                console.error('All data fetch strategies failed', proxyError);
                // Fallback to simulated data for demo UI functionality
                updateUI(generateFallbackData(), true);
            }
        }
    };

    // Event Listeners
    retryBtn.addEventListener('click', fetchData);

    toggleRawBtn.addEventListener('click', () => {
        rawJsonPre.classList.toggle('hidden');
        toggleRawBtn.textContent = rawJsonPre.classList.contains('hidden') ? 'Show JSON' : 'Hide JSON';
    });

    // Initial fetch
    fetchData();

    // Setup polling (every 30 seconds to simulate real-time blockchain monitoring)
    setInterval(fetchData, 30000);
});
