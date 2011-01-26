require 'pusher'

Pusher.app_id = '3528'
Pusher.key = '03cb0652f55212acc073'
Pusher.secret = '908ae93e9c709a32f068'

class FirecssController < ApplicationController

  before_filter :id_client

  def id_client
    session[:client] ||= session.id
    @client = session[:client]
  end

  def index
    puts("Index Session ID: #{@client}")
    source = request.env["HTTP_REFERER"]
    pusher_channel = source.split('?').first.split('://').last.gsub('/','_')
    puts pusher_channel
    edits = params[:edits]
    mods = Rails.cache.fetch(pusher_channel){[]}.dup
    number_mods = mods.length
    edits.each_with_index do |edit, i|
      mods << {:selector => params[:selectors][i], :property => params[:properties][i], :value => params[:values][i], :source => params[:sources][i], :line => params[:lines][i].to_i, :timestamp  => params[:timestamps][i].to_i, :edit  => number_mods + i, :client => @client}
      puts "#{params[:selectors][i]} {#{params[:properties][i]}: #{params[:values][i]}}"
    end
    Pusher[pusher_channel].trigger('FireCSS', mods)
    Rails.cache.write(pusher_channel, mods)
    render :text => '' #nothing needs to be returned
  end

  def polling
    puts("Polling Session ID: #{@client}")
    source = request.env["HTTP_REFERER"]
    pusher_channel = source.split('?').first.split('://').last.gsub('/','_')
    mods = Rails.cache.read(pusher_channel) || [];
    from = (params[:edit] || -1).to_i + 1;
    updates = mods[from, mods.length] || []
    updates.delete_if {|u| u[:client] == @client}
    render_json(updates.to_json)
  end

end
