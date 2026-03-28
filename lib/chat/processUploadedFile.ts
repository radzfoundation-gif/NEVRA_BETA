export async function processUploadedFile(file: File): Promise<any> {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (isImage || isPdf) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = (reader.result as string).split(',')[1];
                if (isImage) {
                    resolve({
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: file.type,
                            data: base64Data
                        }
                    });
                } else {
                    resolve({
                        type: 'document',
                        source: {
                            type: 'base64',
                            media_type: 'application/pdf',
                            data: base64Data
                        }
                    });
                }
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    } else {
        // Text files (.txt, .md, .csv)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const fileContents = reader.result as string;
                resolve({
                    type: 'text',
                    text: `File: ${file.name}\n\n${fileContents}`
                });
            };
            reader.onerror = error => reject(error);
            reader.readAsText(file);
        });
    }
}
