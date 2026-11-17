FROM python:3.12-slim
WORKDIR /e2e
COPY tests/e2e/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY tests/e2e/ .
COPY handoff/database/Ensure_Analytics_Metadata.sql /e2e/metadata.sql
COPY handoff/database/Ensure_Poi_Category.sql /e2e/category.sql
COPY handoff/database/Normalize_Localization_Timestamps.sql /e2e/normalize-timestamps.sql
ENTRYPOINT ["python", "/e2e/admin_e2e.py"]
