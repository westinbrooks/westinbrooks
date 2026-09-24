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
            const maxChars = 160;
            if (reviewText.length > maxChars) {
                const truncateIndex = reviewText.lastIndexOf(' ', maxChars);
                reviewText = (truncateIndex > 0 ? reviewText.substring(0, truncateIndex) : reviewText.substring(0, maxChars)).trim() + '...';
            }

            // Create HTML layout
            widget += `<table border="0" cellpadding="0" cellspacing="0" style="table-layout: fixed !important; border: none !important; border-collapse: collapse !important; border-spacing: 0 !important; width: 100% !important; margin-bottom: 20px; background: transparent !important;">
  <tr style="border: none !important; background: transparent !important;">
    <td style="border: none !important; padding: 0 !important; width: 80px !important; min-width: 80px !important; max-width: 80px !important; vertical-align: top; background: transparent !important;">
      <a href="${filmUrl}">
        <img src="${poster}" alt="${filmTitle}" width="80" height="120" style="width: 80px !important; height: 120px !important; min-width: 80px !important; max-width: 80px !important; object-fit: cover; border-radius: 4px; display: block; border: none !important;" />
      </a>
    </td>
    <td style="border: none !important; padding: 8px 0 0 16px !important; vertical-align: top; text-align: left; background: transparent !important; overflow: hidden;">
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