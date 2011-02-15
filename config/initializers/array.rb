class Array

  def extract!
    result = []
    self.delete_if do |item|
      (yield(item)) && (result << item)
    end
    return result
  end

  def take_while!
    result = self.take_while {|item| yield(item)}
    self.slice!(0,result.length)
    return result
  end

end