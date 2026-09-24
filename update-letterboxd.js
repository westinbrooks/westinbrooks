const { Letterboxd, isDiary } = require('letterboxd-api');
const fs = require('fs');

const USERNAME = process.env.LETTERBOXD_USERNAME;
const letterboxd = new Letterboxd();

async function updateReadme() {
    try {
        // Fetch Letterboxd data
        const items = await letterboxd.user(USERNAME).items();

        // Get the 3 latest diary entries (reviews)
        const reviews = items.filter(isDiary).slice(0, 3);

        if (reviews.length === 0) {
            console.log("No reviews found");
            return;
        }

        // Build the widget with 3 reviews
        let widget = "\n";

        reviews.forEach((review) => {
            const filmTitle = review.film.name;
            const filmUrl = `https://letterboxd.com${review.film.url}`;
            const poster = review.film.poster.small;
            const rating = review.rating ? '★'.repeat(review.rating) : '';

            widget += `[![${filmTitle}](${poster})](${filmUrl} "${filmTitle} ${rating}") `;
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
        console.log(`Updated README with ${reviews.length} reviews`);

    } catch (error) {
        console.error("Error updating README:", error);
        process.exit(1);
    }
}

updateReadme();