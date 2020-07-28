export class Formatter {
    static slug(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "")
    }

    /**
     * 1 = january
     */
    static month(index: number): string {
        const monthNames = ["januari", "februari", "maart", "april", "mei", "juni",
            "juli", "augustus", "september", "oktober", "november", "december"
        ];
        return monthNames[index - 1]
    }

    /**
     * 1 januari (2020). Year only in different year
     */
    static date(date: Date): string {
        const currentYear = new Date().getFullYear()
        const year = date.getFullYear()
        return date.getDate() + " " + this.month(date.getMonth() + 1) + (currentYear != year ? (" "+year) : "")
    }

    static price(value: number): string {
        const formatted = new Intl.NumberFormat("nl-BE", {
            style: "currency",
            currency: "EUR",
        }).format(Math.abs(value) / 100);

        return formatted.replace(new RegExp("EUR", "ig"), '€');
    }

    static capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static fileSize(bytes: number) {
        if (bytes < 1000) {
            return bytes+" bytes"
        }

        if (bytes < 1000*1000) {
            return Math.round(bytes/1000) + " kB"
        }

        if (bytes < 1000 * 1000 * 1000) {
            return Math.round(bytes / 1000 / 100)/10 + " MB"
        }

        return Math.round(bytes / 1000 / 1000 / 10) / 100 + " GB"
    }
}