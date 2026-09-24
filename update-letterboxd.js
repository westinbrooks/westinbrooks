const fs = require('fs');
const path = require('path');
const Letterboxd = require('letterboxd-api').default;

async function updateReadme() {
    try {
        // Safety check to verify environment variable is present
        const username = process.env.LETTERBOXD_USERNAME;
        if (!username) {
            console.error('Error: LETTERBOXD_USERNAME environment variable is not set.');
            process.exit(1);
        }

        const letterboxd = await Letterboxd(username);

        // Retrieve latest 3 reviews
        const reviews = letterboxd
            .filter(item => item.type === 'diary')
            .slice(0, 3);

        // Generate widget markdown table with spacing
        let widget = '\n| | |\n|---|---|\n';
        reviews.forEach((review) => {
            const filmTitle = review.film.title;

            // Add 'https://' if it's missing from the URI
            const rawUri = review.uri || '';
            const filmUrl = rawUri.startsWith('http') ? rawUri : `https://${rawUri}`;

            // Retrieve high-res poster image and falling back if necessary
            const poster = review.film.image
                ? (review.film.image.large || review.film.image.medium || review.film.image.small)
                : '';

            const rating = review.rating.text;
            let reviewText = review.review || '';

            // Cleanup review text - remove newlines to prevent table spillage
            reviewText = reviewText.trim().replace(/\n{3,}/g, '\n\n').replace(/\n/g, ' ');

            // Limit character requests to 240 to fit in table cell
            const maxChars = 240;
            if (reviewText.length > maxChars) {
                const truncateIndex = reviewText.lastIndexOf(' ', maxChars);
                reviewText = (truncateIndex > 0 ? reviewText.substring(0, truncateIndex) : reviewText.substring(0, maxChars)).trim() + '...';
            }

            // Escape pipe characters in review text for markdown table
            reviewText = reviewText.replace(/\|/g, '\\|');

            // Create markdown table row with native spacing
            widget += `| ![${filmTitle}](${poster}) | **[${filmTitle}](${filmUrl})**<br/>${rating}<br/><br/>${reviewText} |\n`;
        });

        // Read the README file
        const readmePath = path.join(process.cwd(), 'README.md');
        let readmeContent = fs.readFileSync(readmePath, 'utf-8');

        // Replace content between markers
        const startMarker = '<!-- LETTERBOXD:START -->';
        const endMarker = '<!-- LETTERBOXD:END -->';
        const startIndex = readmeContent.indexOf(startMarker) + startMarker.length;
        const endIndex = readmeContent.indexOf(endMarker);

        if (startIndex - startMarker.length === -1 || endIndex === -1) {
            console.error('Markers not found in README.md');
            process.exit(1);
        }

        // Update README
        readmeContent =
            readmeContent.substring(0, startIndex) +
            '\n' + widget +
            readmeContent.substring(endIndex);

        fs.writeFileSync(readmePath, readmeContent, 'utf-8');
        console.log('README updated successfully');
    } catch (error) {
        console.error('Error updating README:', error.message);
        process.exit(1);
    }
}

updateReadme();