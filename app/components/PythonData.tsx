// components/MyComponent.js
import React, {useEffect, useState} from 'react';

const PythonData = () => {

    // const [data, setData] = useState([]);
    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);
    //
    // const handleRunScript = async () => {
    //     console.log('Converting data ...')
    //     const response = await fetch('http://localhost:5000/process-data', {
    //         method: 'POST',
    //         headers: {'Content-Type': 'application/json'},
    //         body: JSON.stringify({csvData: csvData}),
    //     });
    //
    //     if (response.ok) {
    //         const result = await response.json();
    //         console.log('Conversion successful ...')
    //         setData(result);
    //     } else {
    //         console.error('Conversion failed!');
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     handleRunScript();
    // }, []);

    console.log('sdefefef')

    return (
        <div>
            <h1>Data from Flask API</h1>
            {/*{imageUrl && <img src={imageUrl} alt="Generated Plot"/>}*/}
        </div>
    );
};

export default PythonData;
