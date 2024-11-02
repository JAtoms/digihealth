import json
from io import StringIO

import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


def process_to_csv(data):
    csv_data = data['csvData']
    df_list = []

    for key, value in csv_data.items():
        for file in value:
            csv_content = "\n".join(file.split("\r\n")[1:])
            df = pd.read_csv(StringIO(csv_content))
            df_list.append(df)
        if not (df_list):
            continue
        combined_df = pd.concat(df_list, ignore_index=True)
        csv_data[key] = combined_df
        df_list = []
    return csv_data


@app.route('/post_data', methods=['POST', 'GET', 'OPTIONS'])
def post_data():
    if request.method == 'OPTIONS':
        # Respond to the preflight request with 200 OK
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PATCH")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response, 200

    # Your POST logic here
    data = request.json

    process_to_csv(data)

    return '200'


def process_csv(csv_dict):
    max_dt = pd.to_datetime("1900-01-01 12:00:00")
    min_dt = pd.to_datetime("2099-01-01 12:00:00")

    for key, value in csv_dict.items():
        value["Timestamp"] = pd.to_datetime(value["Timestamp"])
        value = value.set_index("Timestamp").drop("Serial Number", axis=1)
        value = value.add_prefix(f"{key}_")
        if max_dt < value.index.max():
            max_dt = value.index.max()
        if min_dt > value.index.min():
            min_dt = value.index.min()
        csv_dict[key] = value

    df = pd.DataFrame({'DateTime': pd.date_range(start=min_dt, end=max_dt, freq='1min')})
    df = df.set_index('DateTime')

    for key, value in csv_dict.items():
        df = df.join(value)

    df["basal_Insulin Delivered (U)"] = df["basal_Rate"] / 60  # df["basal_Duration (minutes)"] *
    df["basal_Insulin Delivered (U)"] = df["basal_Insulin Delivered (U)"].ffill()
    df['bolus_Trigger'] = np.where(df['bolus_Carbs Input (g)'] == 0, 'Automatic', 'Manual')
    df["bolus_Insulin Delivered (U)"] = df["bolus_Insulin Delivered (U)"].fillna(0)
    df["cgm_CGM Glucose Value (mmol/l)"] = df["cgm_CGM Glucose Value (mmol/l)"].interpolate(method='time')
    df["Time"] = (df.index).time

    return df


def main():
    df = ProcessData([])
    return jsonify(df.to_dict(orient='records'))


if __name__ == "__main__":
    app.run(debug=True)
