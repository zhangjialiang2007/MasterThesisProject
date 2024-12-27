
class Utils {
    static async fetchJson(url) {
        let response = await fetch(url);
        let data = await response.json();
        return data;
    }
}

export default Utils;