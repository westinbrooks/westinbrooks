const { Letterboxd, isDiary } = require('letterboxd-api');
const fs = require('fs');

const USERNAME = process.env.LETTERBOXD_USERNAME;

async function updateReadme() {
    try {
        // Fetch Letterboxd data
        const items = await letterboxd(USERNAME);

        // Get the 3 latest diary entries (reviews)
        const reviews = items.filter(isDiary).slice(0, 3);

        if (latestReviews.length === 0) {
            console.log("No reviews found");
            return;
        }

        // Build the widget with 3 reviews
        let widget = "\n";

        latestReviews.forEach((review) => {
            const filmTitle = review.film.title;
            const filmUrl = review.film.url;
            const poster = review.film.poster;
            const rating = review.rating?.text || "★☆☆☆☆";

            widget += `[![${filmTitle}](${poster})${rating}</a> `;
        });

        widget += "\n";

        // Read your current README
        let readme = fs.readFileSync("README.md", "utf8");

        // Find and replace the section between markers
        const startMarker = "<!-- LETTERBOXD:START -->";
        const endMarker = "<!-- LETTERBOXD:END -->";

        if (readme.includes(startMarker) && readme.includes(endMarker)) {
            readme = readme.replace(
                new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`),
                `${startMarker}${widget}${endMarker}`
            );
        } else {
            console.log("Markers not found in README");
            return;
        }

        // Write back to README
        fs.writeFileSync("README.md", readme);
        console.log(`Updated README with ${latestReviews.length} reviews`);

    } catch (error) {
        console.error("Error updating README:", error);
        process.exit(1);
    }
}

updateReadme();