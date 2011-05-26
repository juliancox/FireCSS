require 'pusher'
require 'uri'
require 'net/http'

Pusher.app_id = '3528'
Pusher.key = '03cb0652f55212acc073'
Pusher.secret = '908ae93e9c709a32f068'

class FirecssController < ApplicationController

  #TODO reset on reload - no restarting server
  #TODO Test edits from different machines at same time - do we need to track source?
  #TODO password/chanel access
  #TODO save button
  #TODO setting for FireCSS server - get the server address from href of firecss script in page (saves working out editing of server address in prefs)
  #TODO Pick up new rules and edits in css panel
  #TODO Use same method for propagating html edits
  #TODO handle clicking the disbale css button.
  #TODO reset button?
  #TODO run using node on Duostack - and use node locally?
  #TODO disable buttons when no save or reset options (eg no edits or script not loaded).

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
      if (edit.to_i == -1)
        mods = []
        puts "reset"
      else
        mods << {:selector => params[:selectors][i], :property => params[:properties][i], :value => params[:values][i], :source => params[:sources][i], :line => params[:lines][i].to_f, :timestamp  => params[:timestamps][i].to_i, :edit  => number_mods + i, :client => @client}
        puts "#{params[:selectors][i]} {#{params[:properties][i]}: #{params[:values][i]}}"
      end
    end
    Pusher[pusher_channel].trigger('FireCSS', mods)
    Rails.cache.write(pusher_channel, mods)
    puts y mods
    render :text => '' #nothing needs to be returned
  end

  def polling
    puts("Polling Session ID: #{@client}")
    source = request.env["HTTP_REFERER"]
    pusher_channel = source.split('?').first.split('://').last.gsub('/','_')
    mods = Rails.cache.read(pusher_channel) || [];
    from = (params[:edit] || -1).to_i + 1;
    if (from < 1)
      dummy = '1'
    end
    if (from > mods.length)  #this browser needs to reset itself so send reset message
      render_json('reload'.to_json)
    else
      updates = mods[from, mods.length] || []
      updates.each_with_index {|u, i|
        if u[:client] == @client
          updates[i] = u.dup.update(:selector => nil) #somehow if we don't dup it can update the cache copy even though that's a dup and written out - go figure!
        end
      } # remove selector so client that sent updates doesn't reprocess them.
      if updates.length > 0
        dummy = '1'
      end
      puts y updates
      render_json(updates.to_json)
    end
  end

  def download
    source = params[:referer]
    pusher_channel = source.split('?').first.split('://').last.gsub('/','_')
    mods = Rails.cache.read(pusher_channel) || [];
    if (mods.length > 0)
      mods_by_source = {}
      mods.each do |m|
        mods_by_source[m[:source]] ||= []
        mods_by_source[m[:source]] << m.dup
      end
      #apply to mods to the css files
      css_data = {}
      mods_by_source.each do |source, mods|
        filename = source.split('?').first.split('/').last
        text = load_source(source);
        updated_text = apply_changes(text, mods)
        css_data[filename] = updated_text
      end
      if (css_data.length > 1)  #have multiple file changes - zip them up and output zip file
        data = StringIO.new
        Zip::ZipOutputStream.use('zip.css', data) do |z|
          css_data.each do |name, css|
            z.put_next_entry(name)
            z.print css
          end
        end
        send_data data.string, :filename => 'css.zip', :type => 'application/zip', :disposition => 'attachment'
      else  #single file just download the css file
        data = css_data.to_a.flatten
        send_data data[1], :filename => data[0], :type => 'text/css', :disposition => 'attachment'
      end
    end
  end

  def signup
    fb = Fanboy.add(params[:email]);
    if request.xhr?
      render :partial => 'firecss/thanks_fanboy'
    end
  end

  private

  def load_source url  #get a file from url or local file structure
    uri = URI.parse(url)
    if (uri.host == request.host) && (uri.port == request.port) && (FileTest.exist?("#{RAILS_ROOT}/public#{uri.path}"))  #file is from this server and it’s a public file - not some controller request
      return IO.read("#{RAILS_ROOT}/public#{uri.path}")
    else  #file from some other host download the content
      return  Net::HTTP.get(uri)
    end
  end

  def apply_changes text, mods  #apply an array of css changes to the incoming text file
    # sort mods by line number, selector, and mod number
    # now we also have new rule edits which add a fraction to the line number
    # add these edits in so they don't affect the current line numbering (ie at the end of an existing edit)
    # since they're in order we can add to end of existing rule even if it has a new rule added
    # to find the end of an existing rule we need the first unquoted } or } unwrapped by ()
    lines = text.split("\n") #StringIO.new(text).readlines
    mods.sort!{|a,b| a[:line] != b[:line] ? a[:line] <=> b[:line] : (a[:property] != b[:property] ? a[:property] <=> b[:property] : a[:edit] <=> b[:edit])}
    no_line_mods = mods.take_while!{|m| m[:line] == 0}  # mods now has only ones with line numbers
    mods.each_with_index do |m, i|
      puts m[:line]
      if (i == (mods.length-1)) || ((m[:line] != mods[i+1][:line]) || (m[:selector] != mods[i+1][:selector]) || (m[:property] != mods[i+1][:property]))
        #this line in not superceeded by the next one so apply it.
        regx = Regexp.new(m[:property]+'\s?:\s?[^};$]+',true)
        lineNo = m[:line] - 1 #array of line starts at 0 - file lines start at 1
        lines[lineNo..lines.length].each_with_index do |line, i|
          result = line.sub!(regx,"#{m[:property]}: #{m[:value]}")
          break if result;
          if line =~ /\}/  #we found the closing bracket but haven't been able to replace so insert prior to bracket #TODO handle close brackets in quotes or brackets
            prev = i+lineNo-1
            if (prev > 0) 
              lines[prev] += ';' if (!(lines[prev] =~ /\{.?\z/) && !(lines[prev] =~ /;.?\z/))
              whitespace = /\A\s+/.match(lines[prev])
            end
            line.sub!(/\}/,"#{(whitespace ? whitespace[0] : '')}#{m[:property]}: #{m[:value]};\n}")
            break;
          end
        end
      end
    end
    #now we need to handle unnumbered lines + html
    #apply changes with line numbers first as any additions we make will change line numbering
    # for each change with line number
    #  find the line the ruleset comes from
    #  get the rule set
    #  change existing rule or add new rule to bottom of rule set on same line as } so line numbering doesn't change
    # end
    #
    # changes without a line number may include previous and post rules?? but in the meantime add rules to bottom of the file
    # or if its html before last style before </head>  if no </style> and <style></style> before head
    # Yup confirmed this is not working even though html file is being saved.
    return lines.join("\n")
  end

  def apply_changes_to_css text, mods
    return text
  end

  def apply_changes_to_html text, mods
    #html needs to be treated differently because of the ability to add new rules or
    return text
  end

end
