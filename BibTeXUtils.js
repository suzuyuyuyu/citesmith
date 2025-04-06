console.log('Load BibTeX utils');

/**
 * Creates an object with first name and last name properties from a full name string.
 * @param {string} fullname - The full name in the format "Last, First".
 * @returns {object} An object with name properties and methods.
 */
function createNameObject(fullname) {
    return {
        _fullname: fullname,
        get last() {
            if (this._fullname.includes(', ')) {
                const parts = this._fullname.split(', ');
                console.log(parts);
                if (parts.length === 2) {
                    return parts[0];
                } else if (parts.length === 3) {
                    return parts[0] + ' ' + parts[1];
                } else {
                    return '';
                }
            } else {
                const parts = this._fullname.split(' ');
                if (parts.length >= 2) {
                    return parts[parts.length - 1];
                }
                console.log('no last name found');
            }
        },
        get middle() {
            if (this._fullname.includes(', ')) {
                return '';
            } else {
                const parts = this._fullname.split(' ');
                if (parts.length >= 3) {
                    return parts.slice(1, parts.length - 1).join(' ');
                }
                return '';
            }
        },
        get first() {
            if (this._fullname.includes(', ')) {
                const parts = this._fullname.split(', ');
                return parts[parts.length - 1];
            } else {
                const parts = this._fullname.split(' ');
                if (parts.length >= 2) {
                    return parts[0];
                }
                console.log('no first name found');
            }
        },
        get upperfirst() {
            return this.first.toUpperCase();
        },
        get upperlast() {
            return this.last.toUpperCase();
        },
        get firstinit() {
            return this.first.charAt(0).toUpperCase();
        },
        get lastinit() {
            return this.last.charAt(0).toUpperCase();
        }
    };
}


/**
 * Extracts information from a BibTeX string using regular expressions.
 * @param {string} bibTeX - The BibTeX string to extract information from.
 * @returns {string} A formatted string containing extracted information.
 */
function extractInfoFromBibTeX(bibTeX, format = '${firstAuthorLastNameCaps}${year}-${titleSnakeCase}') {
    // Extract various fields from BibTeX
    const bibAuthor = bibTeX.match(/author\s*=\s*{(.*?)}/)?.[1] || '';
    const bibYear = bibTeX.match(/year\s*=\s*{(.*?)}/)?.[1] || '';
    const bibTitle = bibTeX.match(/title\s*=\s*{(.*?)}/)?.[1] || '';
    const bibDoi = bibTeX.match(/doi\s*=\s*{(.*?)}/)?.[1] || '';
    const bibJournal = bibTeX.match(/journal\s*=\s*{(.*?)}/)?.[1] || '';
    const bibVolume = bibTeX.match(/volume\s*=\s*{(.*?)}/)?.[1] || '';
    const bibNumber = bibTeX.match(/number\s*=\s*{(.*?)}/)?.[1] || '';
    const bibPages = bibTeX.match(/pages\s*=\s*{(.*?)}/)?.[1] || '';
    const bibPublisher = bibTeX.match(/publisher\s*=\s*{(.*?)}/)?.[1] || '';
    const bibBooktitle = bibTeX.match(/booktitle\s*=\s*{(.*?)}/)?.[1] || '';
    const bibOrganization = bibTeX.match(/organization\s*=\s*{(.*?)}/)?.[1] || '';
    const bibUrl = bibTeX.match(/url\s*=\s*{(.*?)}/)?.[1] || '';

    // Author parsing
    const originalAuthors = bibAuthor.split(' and ');
    const authors = originalAuthors
    const firstAuthorObj = createNameObject(authors[0]);
    const firstAuthorFullName = firstAuthorObj._fullname;
    const firstAuthorFirstName = firstAuthorObj.first;
    const firstAuthorLastName = firstAuthorObj.last;
    const firstAuthorInitials = firstAuthorObj.firstinit + firstAuthorObj.lastinit;
    const firstAuthorFullNameCaps = firstAuthorObj.upperfirst + ' ' + firstAuthorObj.upperlast;
    const firstAuthorFullNameCapsSnake = firstAuthorObj.upperfirst + '_' + firstAuthorObj.upperlast;
    const firstAuthorFullNameCapsKebab = firstAuthorObj.upperfirst + '-' + firstAuthorObj.upperlast;
    const firstAuthorFirstNameCaps = firstAuthorObj.upperfirst;
    const firstAuthorLastNameCaps = firstAuthorObj.upperlast;

    // Title in snake_case, kebab-case, and camelCase
    const titleSnakeCase = bibTitle.replace(/ /g, '_');
    const titleKebabCase = bibTitle.replace(/ /g, '-');
    // Create a CamelCase version of the title
    const titleCamelCase = bibTitle
        .toLowerCase()
        .split(/\s+/)
        .map((word, index) => {
            if (index === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');

    // Replace placeholders with actual values
    const values = {
        author: bibAuthor,
        firstAuthorFullName,
        firstAuthorFirstName,
        firstAuthorLastName,
        firstAuthorInitials,
        firstAuthorFullNameCaps,
        firstAuthorFullNameCapsSnake,
        firstAuthorFullNameCapsKebab,
        firstAuthorFirstNameCaps,
        firstAuthorLastNameCaps,
        year: bibYear,
        title: bibTitle,
        titleSnakeCase,
        titleKebabCase,
        titleCamelCase,
        doi: bibDoi,
        journal: bibJournal,
        volume: bibVolume,
        number: bibNumber,
        pages: bibPages,
        publisher: bibPublisher,
        booktitle: bibBooktitle,
        organization: bibOrganization,
        url: bibUrl
    };

    // const defaultFormat = '${firstAuthorLastNameCaps}${year}-${titleSnakeCase}';
    let result = format;
    for (const [key, value] of Object.entries(values)) {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    }

    return result;
}
