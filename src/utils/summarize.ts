export function summarizeText(text: string){
    const textLength = text.length;
    if (textLength > 40){
        return text.slice(0, 80) + "...";
    }
    else {
        return text;
    }
}

export function summarizeArray(array: any[]){
    const arrayLength = array.length;
    if(arrayLength > 4){
        return array.slice(0, 4);
    }
    else return array;
}