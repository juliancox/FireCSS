class CreateFanboys < ActiveRecord::Migration
  def self.up
    create_table :fanboys do |t|
      t.string :email

      t.timestamps
    end
  end

  def self.down
    drop_table :fanboys
  end
end
