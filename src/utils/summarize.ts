export function summarizeText(text: string){
    const textLength = text.length;
    if (textLength > 40){
        return text.slice(0, 80) + "...";
    }
    else {
        return text;
    }
}

export function summarizeArray(array: any[], endIndex: number){
    const arrayLength = array.length;
    if(arrayLength > endIndex){
        return array.slice(0, endIndex);
    }
    else return array;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")        // spaces → hyphens
    .replace(/[^\w-]+/g, "")     // remove special chars
    .replace(/--+/g, "-");       // collapse multiple hyphens
}