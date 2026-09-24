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
            // - Using a borderless, background-free HTML table to lock columns side-by-side on GitHub.
            // - Setting 'padding-top: 8px' on the right cell recreates the perfect, balanced spacing.
            widget += `<table style="border: none; border-collapse: collapse; border-spacing: 0; width: 100%; margin-bottom: 20px; background: transparent;">
  <tr style="border: none; background: transparent;">
    <td style="border: none; padding: 0; width: 80px; min-width: 80px; vertical-align: top; background: transparent;">
      <a href="${filmUrl}">
        <img src="${poster}" alt="${filmTitle}" style="width: 80px; height: 120px; object-fit: cover; border-radius: 4px; display: block; max-width: none; border: none;" />
      </a>
    </td>
    <td style="border: none; padding: 0 0 0 16px; padding-top: 8px; vertical-align: top; text-align: left; background: transparent;">
      <div style="font-size: 1.1em; line-height: 1.2; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">
        <a href="${filmUrl}">${filmTitle}</a>
      </div>
      <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 0.95em; color: #ff9d00; line-height: 1.2;">${rating}</p>
      <p style="margin: 0; font-size: 0.9em; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; word-break: break-word; white-space: pre-line;">${reviewText}</p>
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