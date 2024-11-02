import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Loader2 } from "lucide-react";

interface PythonDataProps {
    data: {
        basal: Record<string, unknown>[];
        bolus: Record<string, unknown>[];
        insulin: Record<string, unknown>[];
        alarms: Record<string, unknown>[];
        bg: Record<string, unknown>[];
        cgm: Record<string, unknown>[];
    };
}

const PythonData: React.FC<PythonDataProps> = ({ data }) => {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Processed Data</h2>
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="mb-4">
                    <h3 className="font-semibold">{key}</h3>
                    <pre className="bg-gray-100 p-2 rounded">
                        {JSON.stringify(value, null, 2)}
                    </pre>
                </div>
            ))}
        </div>
    );
};

export default PythonData;