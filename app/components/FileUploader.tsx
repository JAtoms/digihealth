import React, {useState} from 'react';
import {useDropzone} from 'react-dropzone';
import Image from "next/image";
import {file_icon, zip_file} from "@/app/assets";
import Button from "@/app/components/Button";

const FileUploader = ({onUploadStatus, result}) => {

    const [selectedFiles, setSelectedFiles] = useState([]);

    const [csv_dict, setCsvDict] = useState({
        basal: [],
        bolus: [],
        insulin: [],
        cgm: []
    });

    const {getRootProps, getInputProps} = useDropzone({
        onDrop: async (acceptedFiles) => {
            console.log('Reading files ....');
            // Loop through acceptedFiles and filter out unwanted files
            const filteredFiles = acceptedFiles.filter(file =>
                file.name !== "alarms_data_1.csv" && file.name !== "bg_data_1.csv" && file.name !== ".DS_Store"
            );

            // Initialize an object to store the content
            const fileContents = {};

            // Create a promise for reading all the filtered files
            const fileReadPromises = filteredFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const content = event.target.result; // This is the content of the file
                        fileContents[file.name] = content; // Store content using the file name as key
                        resolve();
                    };
                    reader.onerror = (error) => {
                        reject(error);
                    };
                    reader.readAsText(file); // Read the file as text
                });
            });

            // Wait for all files to be read
            try {
                await Promise.all(fileReadPromises);
                setSelectedFiles(filteredFiles);

                const updatedCsvDict = {...csv_dict};

                filteredFiles.forEach(file => {
                    const fileName = file.name.split('.')[0]; // Remove the extension
                    const [prefix] = fileName.split('_'); // Get the prefix (e.g., 'basal', 'bolus', 'cgm')

                    // Check if the prefix is one of the expected keys
                    if (updatedCsvDict.hasOwnProperty(prefix)) {
                        // Store the content instead of the file object
                        updatedCsvDict[prefix].push(fileContents[file.name]);
                        console.log(`Accepted file: ${file.name}`);
                    } else {
                        console.log(`Ignored file: ${file.name}`); // For files that do not match any expected key
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
        const uploadResult = await uploadFiles();
        console.log(`uploadResult ${uploadResult}`)
        result(uploadResult)
        setSelectedFiles([]); // Clear selected files after upload
    };

    const uploadFiles = async () => {
        onUploadStatus('uploading'); // Notify that upload has started

        try {
            console.log('Uploading files ...')
            const response = await fetch('http://localhost:5000/post_data', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({csvData: csv_dict}),
            });

            if (response.ok) {
                console.log('Uploading successful ...')
                return response;
            } else {
                console.error('Uploading failed!');
                return await response.json();
            }


        } catch (error) {
            onUploadStatus('error', error); // Notify that there was an error
            throw new Error(`Upload failed: `);
        }

    };

    return (
        <div className={'padding-x'}>

            <div
                className="border-2 border-dashed border-turquoise_blue mx-[8rem] py-[6rem] rounded-xl flex items-center justify-center">
                <div {...getRootProps()} className="flex flex-col items-center">
                    {/*<input {...getInputProps()} className="hidden"/>*/}
                    <input {...getInputProps({webkitdirectory: 'true'})} />

                    <Image src={file_icon} alt="logo"/>
                    <p className="mt-6">Drag your file(s) to start uploading</p>
                    <p className="mt-4">OR</p>
                    <button
                        className="border border-torquoise_blue mt-4 text-torquoise_blue bg-transparent py-2 px-4 rounded-xl">
                        Browse
                    </button>
                </div>
            </div>

            <div className=" flex flex-row gap-4 border-2 border-ash_bg py-2 px-4 mx-[8rem] mt-8 rounded-xl ">
                <Image src={zip_file} alt="logo"/>
                <div className={'flex flex-row w-full justify-between'}>
                    <div>
                        <p className={'font-bold'}>Selected
                            file(s) {selectedFiles.length != 0 ? selectedFiles.length : ''}</p>
                        <p className={'text-[13px]'}>54mb</p>
                    </div>

                    <Button label={'Upload'} onClick={handleUpload}/>

                </div>
            </div>
        </div>

    );
};
export default FileUploader;
