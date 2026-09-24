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

            // Enforce line-clamping
            const maxChars = 160;
            if (reviewText.length > maxChars) {
                // Truncate at the end of a complete word
                const truncateIndex = reviewText.lastIndexOf(' ', maxChars);
                reviewText = (truncateIndex > 0 ? reviewText.substring(0, truncateIndex) : reviewText.substring(0, maxChars)).trim() + '...';
            }

            // Create HTML layout
            widget += `<table border="0" cellpadding="0" cellspacing="0" style="border: none !important; border-collapse: collapse; border-spacing: 0; width: 100%; margin-bottom: 20px; background: transparent;">
  <tr style="border: none !important; background: transparent;">
    <td style="border: none !important; padding: 0; width: 80px; min-width: 80px; vertical-align: top; background: transparent;">
      <a href="${filmUrl}">
        <img src="${poster}" alt="${filmTitle}" width="80" height="120" style="width: 80px; height: 120px; object-fit: cover; border-radius: 4px; display: block; border: none !important; max-width: none;" />
      </a>
    </td>
    <td style="border: none !important; padding: 8px 0 0 16px; vertical-align: top; text-align: left; background: transparent;">
      <div style="font-size: 1.1em; line-height: 1.2; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">
        <a href="${filmUrl}">${filmTitle}</a>
      </div>
      <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 0.95em; color: #ff9d00; line-height: 1.2;">${rating}</p>
      <p style="margin: 0; font-size: 0.9em; line-height: 1.4; white-space: pre-line;">${reviewText}</p>
    </td>
  </tr>
</table>\n`;
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