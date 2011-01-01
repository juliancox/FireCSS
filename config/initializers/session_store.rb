# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_firecss_session',
  :secret      => '53fa9af190b0f78bb8a7c5682ac3d81ce9eb1129771702d2c2972483287ef6fba0790bda3e77506927e5da38fe7883c1735241eb3848632349d95a6098b807a9'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
