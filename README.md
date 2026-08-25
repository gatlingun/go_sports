# go_sports!!!!

## Background
A simple web program with learning intent to track sports
The idea as of now is to track all 32 NFL teams for the upcoming 2026-27 NFL season where we can quickly pull down team stats, schedule, news, etc.

Intended architecture is:

Frontend:
HTML + CSS + Typescript/Javascript

Backend:
GO

Where backend fetches all relevant information and frontend serves the data.

### API data provider
[api-sports.io](https://api-sports.io) free tier is used for this project serving 100 requests per day.
To run locally simply create an account and pop your api key into a .env file at the top level directory. The GO backend will read it dynamically as long as it's stored in the format your_custom_arbritary_var_name=<api_key> :)

### Revision history

gatlingun 08/2026 Project start
gatlingun 08/2026 api-sports.io integrated as data source

### AI Disclaimer
AI coding assistants were used in the creation of this project