import { useState } from "react";
import FileUploader from "@/app/components/FileUploader";
import PythonData from "@/app/components/PythonData";

// Definice typů pro data
interface ProcessedData {
    basal: Record<string, unknown>[];
    bolus: Record<string, unknown>[];
    insulin: Record<string, unknown>[];
    alarms: Record<string, unknown>[];
    bg: Record<string, unknown>[];
    cgm: Record<string, unknown>[];
}

interface ServerResponse {
    message: string;
    processed_data?: ProcessedData;
    error?: string;
}

export default function Dashboard() {
    const [uploadMessage, setUploadMessage] = useState<string>('');
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);

    // Function to handle upload status
    const handleUploadStatus = (status: string, data?: ServerResponse) => {
        if (status === 'uploading') {
            setUploadMessage('Uploading files...');
        } else if (status === 'finished' && data) {
            setUploadMessage('Upload successful');
            if (data.processed_data) {
                setProcessedData(data.processed_data);
                console.log('Processed data:', data.processed_data);
            }
        } else if (status === 'error') {
            setUploadMessage(`Upload error: ${data?.error || 'Unknown error'}`);
            setProcessedData(null);
        }
    };

    return (
        <div className={'flex-1 h-full bg-white m-[2rem] p-8'}>
            {uploadMessage && (
                <div className="mb-4 p-4 rounded bg-gray-100">
                    {uploadMessage}
                </div>
            )}
            {processedData && <PythonData data={processedData} />}
            <FileUploader onUploadStatus={handleUploadStatus} />
        </div>
    );
}