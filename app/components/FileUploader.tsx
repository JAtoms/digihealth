import React, {useState} from 'react';
import {useDropzone} from 'react-dropzone';
import Image from "next/image";
import {file_icon, zip_file} from "@/app/assets";
import Button from "@/app/components/Button";

// Definice typů pro data
interface CsvDict {
    basal: string[];
    bolus: string[];
    insulin: string[];
    alarms: string[];
    bg: string[];
    cgm: string[];
}

interface FileContents {
    [key: string]: string;
}

// Definice typu pro data odpovědi ze serveru
interface ServerResponse {
    message: string;
    processed_data?: Record<string, unknown[]>;
    error?: string;
}

interface FileUploaderProps {
    onUploadStatus: (status: string, data?: ServerResponse) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const FileUploader: React.FC<FileUploaderProps> = ({onUploadStatus}) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [csv_dict, setCsvDict] = useState<CsvDict>({
        basal: [],
        bolus: [],
        insulin: [],
        alarms: [],
        bg: [],
        cgm: []
    });

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: async (acceptedFiles) => {
            console.log('Reading files ....');
            const filteredFiles = acceptedFiles.filter(file =>
                file.name !== "alarms_data_1.csv" && 
                file.name !== "bg_data_1.csv" && 
                file.name !== ".DS_Store"
            );

            const fileContents: FileContents = {};

            const fileReadPromises = filteredFiles.map(file => {
                return new Promise<void>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target && typeof event.target.result === 'string') {
                            const content = event.target.result
                                .replace(/^\uFEFF/, '')  // Odstraní BOM
                                .replace(/\r\n/g, '\n')  // Normalizuje konce řádků
                                .trim();  // Odstraní prázdné znaky na začátku a konci
                            
                            fileContents[file.name] = content;
                            resolve();
                        } else {
                            reject(new Error('Failed to read file content'));
                        }
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsText(file, 'utf-8');  // Explicitně specifikujeme UTF-8
                });
            });

            try {
                await Promise.all(fileReadPromises);
                setSelectedFiles(filteredFiles);

                const updatedCsvDict = { ...csv_dict };

                filteredFiles.forEach(file => {
                    const fileName = file.name.split('.')[0];
                    const [prefix] = fileName.split('_');

                    if (prefix in updatedCsvDict) {
                        updatedCsvDict[prefix as keyof CsvDict].push(fileContents[file.name]);
                        console.log(`Accepted file: ${file.name}`);
                        console.log(`File content preview:`, fileContents[file.name].substring(0, 100));
                    } else {
                        console.log(`Ignored file: ${file.name}`);
                    }
                });

                setCsvDict(updatedCsvDict);
                console.log('All files read.');
            } catch (error) {
                console.error('Error reading files:', error);
            }
        },
    });

    const handleUpload = async () => {
        try {
            await uploadFiles();
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const uploadFiles = async () => {
        onUploadStatus('uploading');

        try {
            console.log('Checking server status...');
            
            const healthCheck = await fetch(`${API_URL}/`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!healthCheck.ok) {
                throw new Error('Server is not responding properly');
            }

            console.log('Server health check passed');
            console.log('Uploading files...');
            console.log('Data to be sent:', csv_dict);

            const response = await fetch(`${API_URL}/post_data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(csv_dict)
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const responseData = await response.json();
            console.log('Upload successful:', responseData);
            onUploadStatus('finished', responseData);
            setSelectedFiles([]); 
            return responseData;

        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Failed to connect to server';
            onUploadStatus('error', {
                message: 'Error',
                error: errorMessage
            });
            throw error;
        }
    };

    return (
        <div className={'padding-x'}>
            <div className="border-2 border-dashed border-turquoise_blue mx-[8rem] py-[6rem] rounded-xl flex items-center justify-center">
                <div {...getRootProps()} className="flex flex-col items-center">
                    <input {...getInputProps()} />
                    <Image src={file_icon} alt="logo"/>
                    <p className="mt-6">Drag your file(s) to start uploading</p>
                    <p className="mt-4">OR</p>
                    <button className="border border-torquoise_blue mt-4 text-torquoise_blue bg-transparent py-2 px-4 rounded-xl">
                        Browse
                    </button>
                </div>
            </div>

            <div className="flex flex-row gap-4 border-2 border-ash_bg py-2 px-4 mx-[8rem] mt-8 rounded-xl">
                <Image src={zip_file} alt="logo"/>
                <div className={'flex flex-row w-full justify-between'}>
                    <div>
                        <p className={'font-bold'}>Selected
                            file(s) {selectedFiles.length !== 0 ? selectedFiles.length : ''}</p>
                        <p className={'text-[13px]'}>54mb</p>
                    </div>
                    <Button label={'Upload'} onClick={handleUpload}/>
                </div>
            </div>
        </div>
    );
};

export default FileUploader;
