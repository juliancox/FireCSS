class Fanboy < ActiveRecord::Base

  def Fanboy.add(mail)
    Fanboy.find_by_email(mail) || Fanboy.create(:email => mail) if mail.to_s != ''
  end

end
