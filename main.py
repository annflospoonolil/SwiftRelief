from fastapi import FastAPI
import psycopg2
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel # Add this import

class EmergencyReport(BaseModel):
    location: str
    symptom: str

# 1. Create the App instance (The "Engine")
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # This allows any website (like your React app) to connect
    allow_methods=["*"],
    allow_headers=["*"],
)
DB_PARAMS = {
    "host": "localhost",
    "database": "swiftrelief_db",
    "user": "postgres",
    "password": "admin123" 
}
@app.post("/report-emergency")
def report_emergency(report: EmergencyReport):
    # Now you access data using report.location and report.symptom
    location = report.location
    symptom = report.symptom
    symptom_lower = symptom.lower()

    if any(word in symptom_lower for word in ["heart", "breath", "unconscious", "stroke"]):
        priority = 1
    elif any(word in symptom_lower for word in ["fracture", "bone", "fever", "pain"]):
        priority = 2
    else:
        priority = 3

    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO emergency_reports (location, symptom, priority) VALUES (%s, %s, %s)",
            (location, symptom, priority)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "Success", "dispatched_priority": priority}
    except Exception as e:
        return {"status": "Error", "message": str(e)}
# 2. Define a "Route" (The "Bridge")
@app.get("/view-reports")
def view_reports():
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        # This SQL command asks for everything in the table
        cur.execute("SELECT * FROM emergency_reports ORDER BY priority ASC;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        # Mapping the database rows to a readable list
        reports = []
        for r in rows:
            reports.append({
                "report_id": r[0], 
                "location": r[1], 
                "symptom": r[2], 
                "priority": r[3]
            })
            
        return {"active_emergencies": reports}
    except Exception as e:
        return {"status": "Error", "message": str(e)}
@app.get("/")
def read_root():
    return {"message": "SwiftRelief API is Online", "status": "Ready for Emergencies"}

# 3. Define a specific feature route
@app.get("/triage")
def check_triage():
    return {"priority": "High", "action": "Dispatch Ambulance"}
@app.delete("/resolve-emergency/{report_id}")
def resolve_emergency(report_id: int):
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        
        # SQL to delete a specific row
        cur.execute("DELETE FROM emergency_reports WHERE id = %s", (report_id,))
        
        conn.commit()
        count = cur.rowcount # Tells us if it actually found a row to delete
        cur.close()
        conn.close()

        if count == 0:
            return {"status": "Error", "message": f"Report ID {report_id} not found."}
            
        return {"status": "Success", "message": f"Emergency {report_id} resolved and cleared."}
    except Exception as e:
        return {"status": "Error", "message": str(e)}
    


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "SwiftRelief Server Error", "details": str(exc)},
    )