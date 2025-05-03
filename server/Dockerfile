FROM python:3.12-slim

WORKDIR /app
RUN mkdir -p /app/server
COPY . /app/server

RUN pip install --no-cache-dir -r server/requirements.txt

EXPOSE 8080

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8080"]