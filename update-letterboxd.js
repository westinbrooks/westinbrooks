const fs = require('fs');
const path = require('path');
const Letterboxd = require('letterboxd-api').default;

async function updateReadme() {
    try {
        const letterboxd = await Letterboxd(process.env.LETTERBOXD_USERNAME);

        // Retrieve latest 3 reviews
        const reviews = letterboxd
            .filter(item => item.type === 'diary')
            .slice(0, 3);

        // Generate widget HTML
        let widget = '\n';
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

            // Cleanup review text
            reviewText = reviewText.trim().replace(/\n{3,}/g, '\n\n');

            // Limit character requests to 500 to automatically fill as needed
            if (reviewText.length > 500) {
                reviewText = reviewText.substring(0, 500).trim() + '...';
            }

            // Create HTML layout
            widget += `<div style="display: flex; gap: 16px; margin-bottom: 20px; height: 120px; overflow: hidden;">
            <div style="flex-shrink: 0;">
                <a href="${filmUrl}">
                    <img src="${poster}" alt="${filmTitle}" style="width: 80px; height: 120px; object-fit: cover; border-radius: 4px;">
                </a>
            </div>
            <div style="display: flex; flex-direction: column; flex-grow: 1; min-width: 0; justify-content: flex-start;">
                <div style="margin: 8px 0 2px 0; font-size: 1.1em; line-height: 1.2; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    <a href="${filmUrl}">${filmTitle}</a>
                </div>
                <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 0.95em; color: #ff9d00; line-height: 1.2;">${rating}</p>
                <p style="margin: 0; font-size: 0.9em; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; word-break: break-word; white-space: pre-line;">${reviewText}</p>
            </div>
            </div>\n`;
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
            '\n' + widget + '\n' +
            readmeContent.substring(endIndex);

        fs.writeFileSync(readmePath, readmeContent, 'utf-8');
        console.log('README updated successfully');
    } catch (error) {
        console.error('Error updating README:', error.message);
        process.exit(1);
    }
}

updateReadme();