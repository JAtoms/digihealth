from flask import Flask, request, jsonify
from flask_cors import CORS
from io import StringIO
import pandas as pd

app = Flask(__name__)

# Povolíme CORS pro všechny routy
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False,
        "max_age": 3600
    }
})

@app.route('/', methods=['GET', 'OPTIONS'])
def home():
    if request.method == 'OPTIONS':
        return '', 204
    return jsonify({
        "message": "Welcome to the API",
        "status": "running",
        "version": "1.0.0"
    })

@app.route('/post_data', methods=['POST', 'OPTIONS'])
def post_data():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        print("Received data:", data)
        
        result_dict = {
            "basal": [],
            "bolus": [],
            "insulin": [],
            "alarms": [],
            "bg": [],
            "cgm": []
        }

        for key in result_dict.keys():
            if key in data and data[key]:
                try:
                    for csv_content in data[key]:
                        # Přeskočíme první řádek s metadaty
                        lines = csv_content.split('\n')
                        if len(lines) > 1:
                            # Použijeme pouze data od druhého řádku
                            header = lines[1]  # Druhý řádek obsahuje hlavičky
                            data_content = '\n'.join(lines[2:])  # Data od třetího řádku
                            
                            if data_content.strip():
                                df = pd.read_csv(
                                    StringIO(header + '\n' + data_content),
                                    skipinitialspace=True,
                                    on_bad_lines='skip'
                                )
                                
                                # Nahradíme NaN hodnoty za None
                                df = df.where(pd.notnull(df), None)
                                
                                # Převedeme DataFrame na seznam slovníků
                                records = []
                                for _, row in df.iterrows():
                                    record = {}
                                    for column in df.columns:
                                        value = row[column]
                                        # Převedeme numpy.int64/float64 na Python int/float
                                        if pd.isna(value):
                                            record[column] = None
                                        elif isinstance(value, (pd.Int64Dtype, pd.Float64Dtype)):
                                            record[column] = float(value)
                                        else:
                                            record[column] = value
                                    records.append(record)
                                
                                result_dict[key].extend(records)
                                print(f"Successfully processed {key} data with {len(records)} records")
                except Exception as e:
                    print(f"Error processing {key} data:", str(e))
                    return jsonify({
                        'message': 'Error',
                        'error': f'Error processing {key} data: {str(e)}'
                    }), 400

        return jsonify({
            "message": "Data processed successfully",
            "processed_data": result_dict
        }), 200

    except Exception as e:
        print("Server error:", str(e))
        return jsonify({
            'message': 'Error',
            'error': str(e)
        }), 500

if __name__ == "__main__":
    print("Starting server...")
    print("Server will be available at http://localhost:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)
