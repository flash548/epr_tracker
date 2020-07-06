FROM postgres:latest
ENV POSTGRES_USER postgres
ENV POSTGRES_PASSWORD password
ENV POSTGRES_DB postgres
COPY seed.sql /docker-entrypoint-initdb.d/seed.sql
RUN mkdir -p /src/app

WORKDIR /src/app

COPY . /src/app

EXPOSE 5432


